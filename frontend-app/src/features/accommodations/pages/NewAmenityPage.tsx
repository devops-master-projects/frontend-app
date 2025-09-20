import { useState } from "react";
import {
    Container,
    Typography,
    TextField,
    Paper,
    Box,
    Button,
    Snackbar,
    CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Navbar from "./Navbar.tsx";
import { createAmenity } from "../api/amenitiesApi.ts";
import { useNavigate } from "react-router-dom";

// DTO za kreiranje pogodnosti
export interface AmenityRequestDto {
    name: string;
    description: string;
}

export default function NewAmenityPage() {
    const theme = useTheme();
    const navigate = useNavigate();

    const [form, setForm] = useState<AmenityRequestDto>({
        name: "",
        description: "",
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleChange = (field: string, value: string) => {
        setForm({ ...form, [field]: value });
    };

    const handleSubmit = async () => {
        const newErrors: Record<string, string> = {};

        if (!form.name.trim()) newErrors.name = "Name is required";
        if (!form.description.trim()) newErrors.description = "Description is required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setLoading(true);
            await createAmenity(form);

            setSuccess(true);
            setForm({ name: "", description: "" });

            // redirect nakon kratkog delay-a
            setTimeout(() => navigate("/accommodations"), 0);
        } catch (err) {
            console.error("Error saving amenity:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <Container maxWidth="sm" disableGutters sx={{ mt: 4, mb: 6 }}>
                <Paper sx={{ p: 4, position: "relative" }}>
                    <Typography
                        variant="h5"
                        gutterBottom
                        sx={{
                            fontWeight: 800,
                            letterSpacing: "-0.5px",
                            textTransform: "uppercase",
                            color: theme.palette.primary.main,
                            borderBottom: "3px solid",
                            borderColor: theme.palette.secondary.main,
                            display: "inline-block",
                            paddingBottom: "4px",
                        }}
                    >
                        Create New Amenity
                    </Typography>

                    <Box
                        component="form"
                        sx={{ mt: 3, display: "flex", flexDirection: "column", gap: 2 }}
                    >
                        <TextField
                            label="Name"
                            fullWidth
                            value={form.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            error={!!errors.name}
                            helperText={errors.name}
                        />

                        <TextField
                            label="Description"
                            fullWidth
                            multiline
                            minRows={3}
                            value={form.description}
                            onChange={(e) => handleChange("description", e.target.value)}
                            error={!!errors.description}
                            helperText={errors.description}
                        />

                        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 2 }}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSubmit}
                                disabled={loading}
                            >
                                {loading ? <CircularProgress size={24} /> : "Save Amenity"}
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Container>

            {/* Snackbar za uspešno čuvanje */}
            <Snackbar
                open={success}
                autoHideDuration={1500}
                onClose={() => setSuccess(false)}
                message="Amenity created successfully!"
            />
        </>
    );
}
