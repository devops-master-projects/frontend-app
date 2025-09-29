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
import {getRole} from "../../auth/api/authApi.ts";

export default function AccommodationDetailsPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [accommodation, setAccommodation] = useState<AccommodationResponseDto | null>(null);
    const [error, setError] = useState<string | null>(null);
    const role : string = getRole();

    useEffect(() => {
        if (!id) return;
        fetchAccommodationById(id)
            .then((data) => setAccommodation(data))
            .catch((err) => {
                console.error("Error loading accommodation:", err);
                setError(err.message);
            });
    }, [id]);

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


                {/* Dugmad */}
                <Box sx={{ mt: 4, display: "flex", gap: 2 }}>
                    {role === "HOST" &&
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate(`/accommodations/${accommodation.id}/edit`)}
                    >
                        EDIT
                    </Button> as ReactElement
                    }
                    { role === "HOST" &&
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate(`/accommodations/${accommodation.id}/availability/new`)}
                    >
                        Availabilities
                    </Button> as ReactElement
                    }
                    { role === "GUEST" &&
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={() => navigate(`/accommodations/${accommodation.id}/reservations/new`)}
                        >
                            Book now
                        </Button> as ReactElement
                    }
                    { role === "HOST" &&
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

            </Paper>
        </Container>
        </>
    );
}
