import { useEffect, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import {
    Box,
    Typography,
    Rating,
    Paper,
    Divider,
    Pagination,
    Grid,
    Button,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Container,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { ReactElement } from "react";
import type { HostReviewDTO } from "../api/reviewApi.ts";
import {deleteHostReview, getHostReviews} from "../api/reviewApi.ts";
import {getRole, getUserId} from "../../auth/api/authApi.ts";
import GuestNavbar from "../../accommodations/navbar/GuestNavbar.tsx";
import HostNavbar from "../../accommodations/navbar/HostNavbar.tsx";
import {canGuestRateHost} from "../../booking/api/bookingApi.ts";
import Navbar from "../../accommodations/navbar/Navbar.tsx";


export default function HostReviewPage() {
    const { id } = useParams<{ id: string }>(); // id = hostId
    const navigate = useNavigate();
    const location = useLocation();
    const host = (location.state as { host?: { firstName: string; lastName: string; email: string } })?.host;
    const role : string = getRole();

    const [reviews, setReviews] = useState<HostReviewDTO[]>([]);
    const [average, setAverage] = useState<number>(0);
    const [page, setPage] = useState<number>(1);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [canRate, setCanRate] = useState<boolean>(false);

    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

    const currentGuestId = getUserId();


    useEffect(() => {
        if (!id) return;

        getHostReviews(id, page - 1, 5)
            .then((data) => {
                setReviews(data.content);
                setTotalPages(data.totalPages);
                setAverage(data.averageRating);
            })
            .catch((err) => console.error("Failed to load host reviews:", err));
    }, [id, page]);

    useEffect(() => {
        if (role !== "GUEST" || !id) return;
        canGuestRateHost(id)
            .then((result) => {
                console.log("Can rate host:", result);
                setCanRate(result);
            })
            .catch((err) => {
                console.error("Failed to check if guest can rate host:", err);
            });
    }, [id]);

    const handleEdit = (reviewId: string) => {
        navigate(`/hosts/${id}/reviews/${reviewId}/edit`, { state: { host } });
    };

    const handleOpenDelete = (reviewId: string) => {
        setDeleteTargetId(reviewId);
        setConfirmDeleteOpen(true);
    };

    const handleDelete = async () => {
        if (!deleteTargetId) return;

        try {
            await deleteHostReview(deleteTargetId);

            const data = await getHostReviews(id!, page - 1, 5);
            setReviews(data.content);
            setTotalPages(data.totalPages);
            setAverage(data.averageRating);
        } catch (err) {
            console.error("Failed to delete review", err);
            alert("Failed to delete review");
        } finally {
            setConfirmDeleteOpen(false);
            setDeleteTargetId(null);
        }
    };


    const handleLeaveReview = () => {
        if (!id) return;
        navigate(`/hosts/${id}/reviews/new`, { state: { host } });
    };

    return (
        <>
            {role === "HOST" && <HostNavbar /> as ReactElement}
            {role === "GUEST" && <GuestNavbar /> as ReactElement}
            {role === "" && <Navbar /> as ReactElement}
            <Container maxWidth="md" sx={{ mt: 6 }}>
                {/* HEADER — HOST INFO */}
                {host && (
                    <Box sx={{ mb: 3, textAlign: "center" }}>
                        <Typography variant="h5" sx={{ fontWeight: 700 }}>
                            Reviews for {host.firstName} {host.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {host.email}
                        </Typography>
                    </Box> as ReactElement
                )}

                {/* AVERAGE RATING */}
                <Box sx={{ mb: 3, textAlign: "center" }}>
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        Average Rating
                    </Typography>
                    <Rating value={average} precision={0.5} readOnly size="large" />
                    <Typography variant="body2" color="text.secondary">
                        {average.toFixed(1)} / 5
                    </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* REVIEWS LIST */}
                <Grid container spacing={2}>
                    {reviews.length === 0 && (
                        <Grid  size={12}>
                            <Typography
                                variant="body1"
                                color="text.secondary"
                                align="center"
                                sx={{ mt: 2 }}
                            >
                                No reviews yet for this host.
                            </Typography>
                        </Grid> as ReactElement
                    )}

                    {reviews.map((r) => (
                        <Grid size={12} key={r.id}>
                            <Paper
                                sx={{
                                    p: 3,
                                    backgroundColor: "#fff",
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    position: "relative",
                                }}
                            >
                                {/* EDIT / DELETE only if it's their own review */}
                                {currentGuestId === r.guestId && (
                                    <Box
                                        sx={{
                                            position: "absolute",
                                            top: 8,
                                            right: 8,
                                            display: "flex",
                                            gap: 1,
                                        }}
                                    >
                                        <IconButton
                                            size="small"
                                            color="primary"
                                            onClick={() => handleEdit(r.id)}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>
                                        <IconButton
                                            onClick={() => handleOpenDelete(r.id)}
                                            color="error"
                                            size="small"
                                        >
                                            <DeleteIcon />
                                        </IconButton>
                                    </Box> as ReactElement
                                )}

                                <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
                                    <Typography sx={{ fontWeight: 600, mr: 2 }}>
                                        {r.guestFirstName} {r.guestLastName}
                                    </Typography>
                                    <Rating value={r.rating} readOnly />
                                </Box>

                                <Typography
                                    variant="body2"
                                    color="text.secondary"
                                    sx={{ mb: 1,  textAlign: "left" }}
                                >
                                    {new Date(r.createdAt).toLocaleDateString()}
                                </Typography>

                                <Typography variant="body1" align="justify">
                                    {r.comment}
                                </Typography>
                            </Paper>
                        </Grid> as ReactElement
                    ))}
                </Grid>

                {/* PAGINATION */}
                {totalPages > 1 && (
                    <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                        <Pagination
                            count={totalPages}
                            page={page}
                            onChange={(_event, value) => setPage(value)}
                            color="primary"
                        />
                    </Box> as ReactElement
                )}

                {/* LEAVE REVIEW */}
                {canRate && (
                    <Box
                        sx={{
                            display: "flex",
                            justifyContent: "center",
                            mb: 3,
                            pt: 3,
                        }}
                    >
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleLeaveReview}
                        >
                            Leave a Review
                        </Button>
                    </Box> as ReactElement
                )}

                {/* DELETE CONFIRMATION DIALOG */}
                <Dialog
                    open={confirmDeleteOpen}
                    onClose={() => setConfirmDeleteOpen(false)}
                >
                    <DialogTitle>Confirm Delete</DialogTitle>
                    <DialogContent>
                        <Typography>
                            Are you sure you want to delete this review?
                        </Typography>
                    </DialogContent>
                    <DialogActions>
                        <Button onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
                        <Button color="error" variant="contained" onClick={handleDelete}>
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>
            </Container>
        </>
    );
}
