    import {useEffect, useState} from "react";
    import {
    Box,
    Typography,
    Rating,
    Paper,
    Divider,
    Pagination,
    Grid,
    IconButton,
    DialogTitle,
    DialogContent, DialogActions, Button, Dialog
} from "@mui/material";

    import type {ReactElement} from "react";
    import type {AccommodationReviewDTO} from "../api/reviewApi.ts";
    import {deleteReview, getAccommodationReviews} from "../api/reviewApi.ts";
    import DeleteIcon from "@mui/icons-material/Delete";
    import EditIcon from "@mui/icons-material/Edit";
    import {getUserId} from "../../auth/api/authApi.ts";
    import {useNavigate} from "react-router-dom";
    interface ReviewsSectionProps {
        accommodationId: string;
    }

    export function ReviewsSection({ accommodationId }: ReviewsSectionProps) {
        const [reviews, setReviews] = useState<AccommodationReviewDTO[]>([]);
        const [average, setAverage] = useState<number>(0);
        const [page, setPage] = useState<number>(1);
        const [totalPages, setTotalPages] = useState<number>(1);
        const currentGuestId = getUserId();
        const navigate = useNavigate();
        const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
        const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);


        useEffect(() => {
            const fetchReviews = async () => {
                try {
                    const data = await getAccommodationReviews(accommodationId, page, 5);
                    setReviews(data.content);
                    setTotalPages(data.totalPages);
                    setAverage(data.averageRating);
                } catch (e) {
                    console.error("Failed to load reviews", e);
                }
            };
            fetchReviews();
        }, [accommodationId, page]);

        const handleEdit = (id: string) => {
            navigate(`/accommodations/${accommodationId}/reviews/${id}/edit`);
        };

        const handleOpenDelete = (id: string) => {
            setDeleteTargetId(id);
            setConfirmDeleteOpen(true);
        };

        const handleDelete = async () => {
            if (!deleteTargetId) return;
            try {
                await deleteReview(deleteTargetId);
                const data = await getAccommodationReviews(accommodationId, page, 5);
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


        return (
            <>
            <Box sx={{ mt: 6 }}>
                {/* AVERAGE RATING */}
                <Box sx={{ mb: 3, textAlign: "center" }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
                        Average Rating
                    </Typography>
                    <Rating value={average} precision={0.5} readOnly size="large" />
                    <Typography variant="body2" color="text.secondary">
                        {average.toFixed(1)} / 5
                    </Typography>
                </Box>

                <Divider sx={{ my: 3 }} />

                <Grid container spacing={2}>
                    {reviews.map((r) => (
                        <Grid size={12} key={r.id}>
                            <Paper
                                sx={{
                                    p: 3,
                                    backgroundColor: "#fff",
                                    height: "100%",
                                    display: "flex",
                                    flexDirection: "column",
                                    position: "relative"
                                }}
                            >
                                {/* EDIT / DELETE ONLY IF OWN REVIEW */}
                                {currentGuestId === r.guestId && (
                                    <Box sx={{ position: "absolute", top: 8, right: 8, display: "flex", gap: 1 }}>
                                        <IconButton
                                            aria-label="Edit"
                                            size="small"
                                            color="primary"
                                            onClick={() => handleEdit(r.id)}
                                        >
                                            <EditIcon fontSize="small" />
                                        </IconButton>

                                        <IconButton
                                            aria-label="Delete"
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
                                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: "left" }}>
                                    {new Date(r.createdAt).toLocaleDateString()}
                                </Typography>
                                <Typography variant="body1" align="justify" sx={{ flexGrow: 1 }}>
                                    {r.comment}
                                </Typography>
                            </Paper>
                        </Grid> as ReactElement
                    ))}
                </Grid>

                {/* PAGINATION */}
                <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_event: React.ChangeEvent<unknown>, value: number) => setPage(value)}
                        color="primary"
                    />
                </Box>
            </Box>
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
                        <Button onClick={() => setConfirmDeleteOpen(false)}>
                            Cancel
                        </Button>
                        <Button
                            color="error"
                            variant="contained"
                            onClick={handleDelete}
                        >
                            Delete
                        </Button>
                    </DialogActions>
                </Dialog>

            </>

        );
    }