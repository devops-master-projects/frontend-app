import { useState, useEffect } from "react";
import type { ReactElement } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
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
    createHostReview,
    getHostReviewById,
    updateHostReview,
} from "../api/reviewApi.ts";
import GuestNavbar from "../../accommodations/navbar/GuestNavbar.tsx";

export default function NewHostReviewPage() {
    const { id, reviewId } = useParams<{ id: string; reviewId?: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const host = (location.state as { host?: { firstName: string; lastName: string } })?.host;

    const [rating, setRating] = useState<number | null>(0);
    const [comment, setComment] = useState<string>("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (reviewId) {
            getHostReviewById(reviewId)
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
                await updateHostReview(reviewId, { hostId: id, rating, comment });
            } else {
                await createHostReview({ hostId: id, rating, comment });
            }

            navigate(`/hosts/${id}`);
        } catch {
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
                        {reviewId ? "Edit Host Review" : "Leave a Review"}
                    </Typography>

                    {host && (
                        <Typography variant="subtitle1" sx={{ mb: 2 }}>
                            Reviewing {host.firstName} {host.lastName}
                        </Typography> as ReactElement
                    )}

                    <Box sx={{ mb: 3 }}>
                        <Typography gutterBottom>Rating</Typography>
                        <Rating
                            name="rating"
                            value={rating}
                            onChange={(_, newValue) => setRating(newValue)}
                            size="large"
                        />
                    </Box>

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
