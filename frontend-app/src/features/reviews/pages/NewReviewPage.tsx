import { useState, useEffect } from "react";
import type { ReactElement } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
    Box,
    Button,
    Container,
    Paper,
    Rating,
    TextField,
    Typography,
} from "@mui/material";
import {
    createAccommodationReview,
    getReviewById,
    updateReview,
} from "../api/reviewApi.ts";
import GuestNavbar from "../../accommodations/navbar/GuestNavbar.tsx";

export default function NewReviewPage() {
    const { id, reviewId } = useParams<{ id: string; reviewId?: string }>(); // id = accommodationId
    const navigate = useNavigate();

    const [rating, setRating] = useState<number | null>(0);
    const [comment, setComment] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);


    useEffect(() => {
        if (reviewId) {
            getReviewById(reviewId)
                .then((data) => {
                    setRating(data.rating);
                    setComment(data.comment);
                })
                .catch(() => setError("Failed to load review"));
        }
    }, [reviewId]);

    const handleSubmit = async () => {
        if (!id || !rating) {
            setError("Please provide a rating.");
            return;
        }

        try {
            setLoading(true);
            setError(null);

            if (reviewId) {
                console.log("updating...");
                await updateReview(reviewId, {accommodationId: id, rating, comment });
            } else {
                await createAccommodationReview({
                    accommodationId: id,
                    rating,
                    comment,
                });
            }

            navigate(`/accommodations/${id}`);
        } catch (_: unknown) {
            setError("Failed to submit review");
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <GuestNavbar />
            <Container maxWidth="sm" sx={{ mt: 6 }}>
                <Paper sx={{ p: 4 }}>
                    <Typography variant="h5" sx={{ fontWeight: 700, mb: 3 }}>
                        {reviewId ? "Edit Review" : "Leave a Review"}
                    </Typography>

                    {/* Rating */}
                    <Box sx={{ mb: 3 }}>
                        <Typography gutterBottom>Rating</Typography>
                        <Rating
                            name="rating"
                            value={rating}
                            onChange={(_, newValue) => setRating(newValue)}
                            size="large"
                        />
                    </Box>

                    {/* Comment */}
                    <TextField
                        label="Your comment"
                        multiline
                        rows={4}
                        fullWidth
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        sx={{ mb: 3 }}
                    />

                    {error && (
                        <Typography color="error" sx={{ mb: 2 }}>
                            {error}
                        </Typography> as ReactElement
                    )}

                    <Box sx={{ display: "flex", gap: 2, justifyContent: "flex-end" }}>
                        <Button
                            variant="outlined"
                            color="secondary"
                            onClick={() => navigate(-1)}
                            disabled={loading}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="contained"
                            color="primary"
                            onClick={handleSubmit}
                            disabled={loading}
                        >
                            {reviewId ? "Update" : "Submit"}
                        </Button>
                    </Box>
                </Paper>
            </Container>
        </>
    );
}
