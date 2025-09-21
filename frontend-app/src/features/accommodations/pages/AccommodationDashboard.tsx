import {useEffect, useState} from "react";
import  type {ReactElement} from "react";
import {
    Container,
    Typography,
    Pagination,
    Box,
} from "@mui/material";
import Grid from "@mui/material/Unstable_Grid2";
import { fetchAccommodations } from "../api/accommodationsApi";
import type { AccommodationResponseDto } from "../api/accommodationsApi";
import AccommodationCard from "./AccommodationCard";
import Navbar from "./Navbar.tsx";

export default function AccommodationDashboard() {
    const [accommodations, setAccommodations] = useState<AccommodationResponseDto[]>([]);
    const [page, setPage] = useState(1);
    const itemsPerPage = 6;

    useEffect(() => {
        fetchAccommodations()
            .then(setAccommodations)
            .catch((err) => console.error("Error loading accommodations:", err));
    }, []);

    const handleChangePage = (_event: React.ChangeEvent<unknown>, value: number) => {
        setPage(value);
    };

    const startIndex = (page - 1) * itemsPerPage;
    const paginatedAccommodations = accommodations.slice(startIndex, startIndex + itemsPerPage);

    return (
        <>
        <Navbar />
        <Container sx={{ mt: 4 }}>
            <Typography
                variant="h4"
                gutterBottom
                sx={{
                    fontWeight: 800,
                    letterSpacing: "-0.5px",
                    textTransform: "uppercase",
                    color: "primary.main",
                    textShadow: "1px 1px 2px rgba(0,0,0,0.2)",
                    borderBottom: "3px solid",
                    borderColor: "secondary.main",
                    display: "inline-block",
                    paddingBottom: "4px"
                }}
            >
                My Accommodations
            </Typography>

            <Grid container spacing={3}>
                {paginatedAccommodations.map((a) => (
                    <Grid item xs={12} sm={6} md={4} key={a.id}>
                        <AccommodationCard accommodation={a} />
                    </Grid> as ReactElement
                ))}
            </Grid>


            {/* Pagination */}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <Pagination
                    count={Math.ceil(accommodations.length / itemsPerPage)}
                    page={page}
                    onChange={handleChangePage}
                    color="primary"
                />
            </Box>
        </Container>
    </>
    );
}
