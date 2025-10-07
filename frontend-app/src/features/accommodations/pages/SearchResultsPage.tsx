import {useLocation, useNavigate} from "react-router-dom";
import {
    Container,
    Box,
    Typography,
    Card,
    CardContent,
    CardMedia,
    Chip
} from "@mui/material";
import HostNavbar from "../navbar/HostNavbar.tsx";
import type { SearchResponse } from "../api/accommodationsApi";
import type {ReactElement} from "react";
import {searchAccommodations} from "../api/accommodationsApi";
import {useState} from "react";
import GuestNavbar from "../navbar/GuestNavbar.tsx";
import {getRole} from "../../auth/api/authApi.ts";
import Navbar from "../navbar/Navbar.tsx";

export default function SearchResultsPage() {
    const location = useLocation();
    const initialResults = (location.state?.results as SearchResponse[]) || [];
    const [results, setResults] = useState<SearchResponse[]>(initialResults);
    const role : string = getRole();

    const navigate = useNavigate();

    return (
        <>
        {role === "HOST" &&
            <HostNavbar
                enableSearch={true}
                onSearch={async (filters) => {
                    try {
                        const newResults = await searchAccommodations(filters);
                        setResults(newResults);
                    } catch (err) {
                        console.error("Error while searching from results page:", err);
                    }
                }}
            />
        }
            {role === "GUEST" &&
                <GuestNavbar
                    enableSearch={true}
                    onSearch={async (filters) => {
                        try {
                            const newResults = await searchAccommodations(filters);
                            setResults(newResults);
                        } catch (err) {
                            console.error("Error while searching from results page:", err);
                        }
                    }}
                />
            }
            {role === "" &&
                <Navbar
                    enableSearch={true}
                    onSearch={async (filters) => {
                        try {
                            const newResults = await searchAccommodations(filters);
                            setResults(newResults);
                        } catch (err) {
                            console.error("Error while searching from results page:", err);
                        }
                    }}
                />
            }
            <Container sx={{ mt: 4 }}>
                <Typography
                    variant="h4"
                    gutterBottom
                    sx={{
                        fontWeight: 800,
                        letterSpacing: "-0.5px",
                        textTransform: "uppercase",
                        color: "primary.main",
                        borderBottom: "3px solid",
                        borderColor: "secondary.main",
                        display: "inline-block",
                        paddingBottom: "4px",
                    }}
                >
                    Search Results
                </Typography>

                {results.length === 0 && (
                    <Typography sx={{ mt: 3 }} color="text.secondary">
                        No accommodations found for your criteria.
                    </Typography> as ReactElement
                )}

                {results.map((a) => (
                    <Card
                        key={a.id}
                        sx={{
                            display: "flex",
                            mb: 3,
                            borderRadius: 2,
                            boxShadow: 3,
                            transition: "transform 0.2s, box-shadow 0.2s",
                            "&:hover": {
                                transform: "scale(1.02)",
                                boxShadow: 6,
                                cursor: "pointer",
                            },
                        }}
                        onClick={() => navigate(`/accommodations/${a.id}`)}
                    >

                        {a.photos && a.photos.length > 0 && (
                            <CardMedia
                                component="img"
                                sx={{ width: 220, objectFit: "cover" }}
                                image={a.photos[0]}
                                alt={a.name}
                            /> as ReactElement
                        )}

                        <CardContent sx={{ flex: 1 }}>
                            <Typography variant="h6" gutterBottom>
                                {a.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                {a.location.city}, {a.location.country}
                            </Typography>
                            <Typography
                                variant="body2"
                                sx={{
                                    display: "-webkit-box",
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: "vertical",
                                    overflow: "hidden",
                                    textOverflow: "ellipsis",
                                }}
                                gutterBottom
                            >
                                {a.description}
                            </Typography>

                            <Typography variant="body2" sx={{ mt: 1, textAlign: "left" }}>
                                Guests: {a.minGuests} – {a.maxGuests}
                            </Typography>

                            {/* Total + Unit u jednom redu */}
                            <Box sx={{ mt: 1, display: "flex", gap: 2, alignItems: "center" }}>
                                {a.totalPrice > 0 && (
                                    <Typography variant="body1" fontWeight={700}>
                                        Total Price: €{a.totalPrice.toFixed(2)}
                                    </Typography> as ReactElement
                                )}
                                <Typography variant="body2" color="text.secondary">
                                    Unit: €{a.unitPrice?.toFixed(2)} ({a.pricingMode})
                                </Typography>
                            </Box>


                            <Box sx={{ mt: 1, display: "flex", gap: 1, flexWrap: "wrap" }}>
                                {a.amenities?.map((am, idx) => (
                                    <Chip key={idx} label={am} size="small" /> as ReactElement
                                ))}
                            </Box>
                        </CardContent>
                    </Card> as ReactElement
                ))}
            </Container>
        </>
    );
}
