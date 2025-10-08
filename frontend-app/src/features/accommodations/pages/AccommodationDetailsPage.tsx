import {useEffect, useState} from "react";
import  type {ReactElement} from "react";
import {
    Container,
    Typography,
    Paper,
    Box,
    Button,
    Chip,
    Divider,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import { useTheme } from "@mui/material/styles";
import { useNavigate, useParams } from "react-router-dom";
import type { AccommodationResponseDto } from "../api/accommodationsApi";
import { fetchAccommodationById } from "../api/accommodationsApi";
import HostNavbar from "../navbar/HostNavbar.tsx";
import PhotoCarousel from "./PhotoCarousel.tsx";
import GuestNavbar from "../navbar/GuestNavbar.tsx";
import {getHostProfile, getRole, getUserId} from "../../auth/api/authApi.ts";
import {ReviewsSection} from "../../reviews/pages/ReviewsSection.tsx";
import {canGuestRateAccommodation} from "../../booking/api/bookingApi.ts";
import type {HostProfile} from "../../auth/api/authApi.ts";
import { Link } from "react-router-dom";
import Navbar from "../navbar/Navbar.tsx";
export default function AccommodationDetailsPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [accommodation, setAccommodation] = useState<AccommodationResponseDto | null>(null);
    const [error, setError] = useState<string | null>(null);
    const role : string = getRole();
    const userIdFromToken: string = getUserId();
    const [canRate, setCanRate] = useState<boolean>(false);
    const [host, setHost] = useState<HostProfile | null>(null);
    // const [canRateHost, setCanRateHost] = useState(false);

    useEffect(() => {
        if (!id) return;

        fetchAccommodationById(id)
            .then((data) => {
                setAccommodation(data);
            })
            .catch((err) => {
                console.error("Error loading accommodation:", err);
                setError(err.message);
            });
    }, [id]);

    useEffect(() => {
        if (role === "HOST" || !accommodation?.hostId) return;

        getHostProfile(accommodation.hostId)
            .then(setHost)
            .catch((err) => console.error("Failed to load host profile", err));

        if (role !== "GUEST") return;
        canGuestRateAccommodation(accommodation.id)
            .then(setCanRate)
            .catch((err) =>
                console.error("Failed to check accommodation rating eligibility", err)
            );
    }, [role, accommodation]);


    if (error) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Typography color="error">{error}</Typography>
            </Container>
        );
    }

    if (!accommodation) {
        return (
            <Container maxWidth="md" sx={{ mt: 4 }}>
                <Typography>Loading accommodation...</Typography>
            </Container>
        );
    }

    return (
        <>
        {role === "HOST" && <HostNavbar /> as ReactElement}
        {role === "GUEST" && <GuestNavbar /> as ReactElement}
        {role === "" && <Navbar /> as ReactElement}
        <Container maxWidth="md" sx={{ mt: 4, mb: 6 }}>
            <Paper sx={{ p: 4 }}>
                <Typography
                    variant="h4"
                    gutterBottom
                    sx={{ fontWeight: 800, color: theme.palette.primary.main }}
                >
                    {accommodation.name}
                </Typography>

                <Typography variant="subtitle1" gutterBottom>
                    {accommodation.location.address}, {accommodation.location.city},{" "}
                    {accommodation.location.country} ({accommodation.location.postalCode})
                </Typography>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body1" gutterBottom align="justify">
                    {accommodation.description}
                </Typography>


                <Grid container spacing={2} sx={{ mt: 2 }}>
                    <Grid size={6}>
                        <Typography>
                            Guests: {accommodation.minGuests} – {accommodation.maxGuests}
                        </Typography>
                    </Grid>
                    <Grid size={6}>
                        <Typography>
                            Pricing mode: {accommodation.pricingMode}
                        </Typography>
                    </Grid>
                    <Grid size={6}>
                        <Typography>
                            Auto-confirm: {accommodation.autoConfirm ? "Yes" : "No"}
                        </Typography>
                    </Grid>
                </Grid>


                <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }} align={"left"}>
                        Amenities
                    </Typography>
                    <Box sx={{ mt: 1, display: "flex", flexWrap: "wrap", gap: 1 }}>
                        {accommodation.amenities.map((a) => (
                            <Chip key={a.id} label={a.name} /> as ReactElement
                        ))}
                    </Box>
                </Box>

                {host && (
                    <Box
                        sx={{
                            mt: 3,
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Typography
                            component={Link}
                            to={`/hosts/${host.id}`}
                            state={{ host }}
                            variant="subtitle1"
                            sx={{
                                display: "inline-block",
                                fontWeight: 600,
                                textDecoration: "none",
                                color: "inherit",
                                cursor: "pointer",
                                transition: "color 0.2s ease, transform 0.2s ease",
                                "&:hover": {
                                    color: "primary.main",
                                    textDecoration: "underline",
                                    transform: "scale(1.02)",
                                },
                            }}
                        >
                            Host: {host.firstName} {host.lastName}
                        </Typography>
                    </Box> as ReactElement
                )}

                {/* Dugmad */}
                <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
                    {role === "HOST" && userIdFromToken === accommodation.hostId &&
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate(`/accommodations/${accommodation.id}/edit`)}
                    >
                        EDIT
                    </Button> as ReactElement
                    }
                    { role === "HOST" && userIdFromToken === accommodation.hostId  &&
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate(`/accommodations/${accommodation.id}/availability/new`)}
                    >
                        Availabilities
                    </Button> as ReactElement
                    }
                    { role === "GUEST" &&
                        <>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => navigate(`/accommodations/${accommodation.id}/reservations/new`)}
                        >
                            Book now
                        </Button>

                        </> as ReactElement
                    }
                    { role === "HOST" && userIdFromToken === accommodation.hostId &&
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate(`/accommodations/${accommodation.id}/requests`)}
                    >
                        Requests
                    </Button> as ReactElement
                    }
                </Box>

                {accommodation.urlPhotos?.length > 0 && (
                    <PhotoCarousel photos={accommodation.urlPhotos} name={accommodation.name} /> as ReactElement
                )}
                <ReviewsSection accommodationId={accommodation.id} />
                {role === "GUEST" && canRate && (
                    <Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
                        <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => navigate(`/accommodations/${accommodation.id}/reviews/new`)}
                        >
                            Leave a Review
                        </Button>
                    </Box> as ReactElement
                )}

            </Paper>
        </Container>
        </>
    );
}
