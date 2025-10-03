import {useEffect, useState} from "react";
import  type {ReactElement} from "react";
import {
    Container,
    Grid,
    Typography,
    Pagination,
    Box,
} from "@mui/material";
import {fetchAccommodations, searchAccommodations} from "../api/accommodationsApi";
import AccommodationCard from "./AccommodationCard";
import HostNavbar from "../navbar/HostNavbar.tsx";
import GuestNavbar from "../navbar/GuestNavbar.tsx";
import {getRole} from "../../auth/api/authApi.ts";
import {useNavigate} from "react-router-dom";
import type {SearchResponse} from "../api/accommodationsApi";

export default function AccommodationDashboard() {
    const [accommodations, setAccommodations] = useState<SearchResponse[]>([]);
    const [page, setPage] = useState(1);
    const itemsPerPage = 6;
    const role : string = getRole();

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
    const navigate = useNavigate();

    return (
        <>
            {role === "HOST" &&
            <HostNavbar
                onSearch={async (filters) => {
                    try {
                        const results = await searchAccommodations(filters);
                        navigate("/search-results", { state: { results } }); // šaljemo rezultate
                    } catch (err) {
                        console.error("Error while searching:", err);
                    }
                }}

                onHome={async () => {
                    try {
                        const all = await fetchAccommodations();
                        setAccommodations(all);
                        setPage(1);
                        navigate("/accommodations");
                    } catch (err) {
                        console.error("Error while reloading all accommodations:", err);
                    }
                }}
                enableSearch={true}
            />
            }


        {role === "GUEST" && <GuestNavbar
            onSearch={async (filters) => {
                try {
                    console.log("filters: ", filters)
                    const results = await searchAccommodations(filters);
                    navigate("/search-results", { state: { results } }); // šaljemo rezultate
                } catch (err) {
                    console.error("Error while searching:", err);
                }
            }}

            onHome={async () => {
                try {
                    const all = await fetchAccommodations();
                    setAccommodations(all);
                    setPage(1);
                    navigate("/accommodations");
                } catch (err) {
                    console.error("Error while reloading all accommodations:", err);
                }
            }}
            enableSearch={true}
        />}
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
                Accommodations
            </Typography>

            <Grid container spacing={3}>
                {paginatedAccommodations.map((a) => (

                    <Grid size={{ xs: 12, sm: 6, md: 4 }} key={a.id}>
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
