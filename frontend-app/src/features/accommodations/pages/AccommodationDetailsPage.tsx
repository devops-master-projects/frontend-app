import {ReactElement, useEffect, useState} from "react";
import {
    Container,
    Typography,
    Grid,
    Paper,
    Box,
    Button,
    Chip,
    Divider,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import SwipeableViews from "react-swipeable-views";

import { useNavigate, useParams } from "react-router-dom";
import type { AccommodationResponseDto } from "../api/accommodationsApi";
import { fetchAccommodationById } from "../api/accommodationsApi";
import Navbar from "./Navbar.tsx";
import PhotoCarousel from "./PhotoCarousel.tsx";

export default function AccommodationDetailsPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [accommodation, setAccommodation] = useState<AccommodationResponseDto | null>(null);
    const [error, setError] = useState<string | null>(null);

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
        <Navbar/>
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
                    <Grid item xs={6}>
                        <Typography>
                            Guests: {accommodation.minGuests} – {accommodation.maxGuests}
                        </Typography>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography>Pricing mode: {accommodation.pricingMode}</Typography>
                    </Grid>
                    <Grid item xs={6}>
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
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate(`/accommodations/${accommodation.id}/edit`)}
                    >
                        EDIT
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={() => navigate(`/accommodations/${accommodation.id}/availability/new`)}
                    >
                        New Availability
                    </Button>
                    <Button
                        variant="outlined"
                        color="secondary"
                        onClick={() => navigate(`/accommodations/${accommodation.id}/reservations`)}
                    >
                        Reservations
                    </Button>
                </Box>

                {accommodation.urlPhotos?.length > 0 && (
                    <PhotoCarousel photos={accommodation.urlPhotos} name={accommodation.name} /> as ReactElement
                )}

            </Paper>
        </Container>
        </>
    );
}
