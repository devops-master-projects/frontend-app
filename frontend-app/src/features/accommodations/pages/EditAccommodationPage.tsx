import {ReactElement, useEffect, useState} from "react";
import {
    Container,
    Typography,
    TextField,
    Paper,
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    MenuItem,
    Snackbar,
    FormControl,
    InputLabel,
    Select,
    ListItemText,
} from "@mui/material";
import Grid from "@mui/material/Grid";
import CircularProgress from "@mui/material/CircularProgress";
import { useTheme } from "@mui/material/styles";
import { useNavigate, useParams } from "react-router-dom";

import Navbar from "./Navbar.tsx";
import type { AccommodationRequestDto, AccommodationResponseDto } from "../api/accommodationsApi";
import {
    fetchAccommodationById,
    updateAccommodation,
    uploadPhotoToCloudinary,
} from "../api/accommodationsApi";
import type { AmenityResponseDto } from "../api/amenitiesApi";
import { fetchAmenities } from "../api/amenitiesApi";

export default function EditAccommodationPage() {
    const theme = useTheme();
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();

    const [form, setForm] = useState<AccommodationRequestDto>({
        name: "",
        location: { country: "", city: "", address: "", postalCode: "" },
        minGuests: 1,
        maxGuests: 1,
        description: "",
        autoConfirm: false,
        pricingMode: "FIXED",
        photos: [],
        amenities: [],
    });

    const [localPhotos, setLocalPhotos] = useState<File[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const [allAmenities, setAllAmenities] = useState<AmenityResponseDto[]>([]);

    // Učitaj sve amenities
    useEffect(() => {
        fetchAmenities().then(setAllAmenities).catch(console.error);
    }, []);

    // Učitaj smeštaj po id
    useEffect(() => {
        if (!id) return;

        fetchAccommodationById(id)
            .then((data: AccommodationResponseDto) => {
                console.log("Fetched accommodation:", data);
                setForm({
                    name: data.name,
                    location: data.location,
                    minGuests: data.minGuests,
                    maxGuests: data.maxGuests,
                    description: data.description,
                    autoConfirm: data.autoConfirm,
                    pricingMode: data.pricingMode,
                    photos: data.urlPhotos || [],
                    amenities: data.amenities?.map((a) => a.id) || [],
                });
            })
            .catch(console.error);
    }, [id]);


    const handleChange = (field: string, value: unknown) => {
        setForm({ ...form, [field]: value });
    };

    const handleLocationChange = (field: string, value: unknown) => {
        setForm({
            ...form,
            location: { ...form.location, [field]: value },
        });
    };

    const handleFileDrop = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setLocalPhotos((prev) => [...prev, ...files]);
        }
    };

    const handleSubmit = async () => {
        const newErrors: Record<string, string> = {};

        if (!form.name.trim()) newErrors.name = "Name is required";
        if (!form.location.country.trim()) newErrors.country = "Country is required";
        if (!form.location.city.trim()) newErrors.city = "City is required";
        if (!form.location.address.trim()) newErrors.address = "Address is required";
        if (!form.location.postalCode.trim()) newErrors.postalCode = "Postal code is required";
        if (form.minGuests < 1) newErrors.minGuests = "Minimum guests must be at least 1";
        if (form.maxGuests < form.minGuests) newErrors.maxGuests = "Max guests must be greater than min guests";
        if (!form.description.trim()) newErrors.description = "Description is required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setLoading(true);

            // Upload novih slika
            const uploadedUrls = await Promise.all(
                localPhotos.map((file) => uploadPhotoToCloudinary(file))
            );

            // Kombinacija starih + novih
            const request = { ...form, photos: [...(form.photos || []), ...uploadedUrls] };

            await updateAccommodation(id!, request);

            setSuccess(true);
            setTimeout(() => {
                navigate(`/accommodations/${id}`);
            }, 2000);
        } catch (err) {
            console.error("Error updating accommodation:", err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            <Navbar />
            <Container maxWidth="md" disableGutters sx={{ mt: 4, mb: 6 }}>
                <Paper sx={{ p: 4 }}>
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
                        Edit Accommodation
                    </Typography>

                    <Box component="form" sx={{ mt: 3 }}>
                        {/* Polja su ista kao u NewAccommodationPage, samo popunjena */}
                        <Grid container spacing={2}>
                            <Grid size={12}>
                                <TextField
                                    label="Name"
                                    fullWidth
                                    value={form.name}
                                    error={!!errors.name}
                                    helperText={errors.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                />
                            </Grid>
                            <Grid size={12}>
                                <TextField
                                    label="Country"
                                    fullWidth
                                    value={form.location.country}
                                    error={!!errors.country}
                                    helperText={errors.country}
                                    onChange={(e) => handleLocationChange("country", e.target.value)}
                                />
                            </Grid>
                        </Grid>

                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid size={4}>
                                <TextField
                                    label="City"
                                    fullWidth
                                    value={form.location.city}
                                    error={!!errors.city}
                                    helperText={errors.city}
                                    onChange={(e) => handleLocationChange("city", e.target.value)}
                                />
                            </Grid>
                            <Grid size={4}>
                                <TextField
                                    label="Address"
                                    fullWidth
                                    value={form.location.address}
                                    error={!!errors.address}
                                    helperText={errors.address}
                                    onChange={(e) => handleLocationChange("address", e.target.value)}
                                />
                            </Grid>
                            <Grid size={4}>
                                <TextField
                                    label="Postal Code"
                                    fullWidth
                                    value={form.location.postalCode}
                                    error={!!errors.postalCode}
                                    helperText={errors.postalCode}
                                    onChange={(e) => handleLocationChange("postalCode", e.target.value)}
                                />
                            </Grid>
                        </Grid>

                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid size={4}>
                                <TextField
                                    label="Min Guests"
                                    type="number"
                                    fullWidth
                                    value={form.minGuests}
                                    error={!!errors.minGuests}
                                    helperText={errors.minGuests}
                                    onChange={(e) => handleChange("minGuests", +e.target.value)}
                                />
                            </Grid>
                            <Grid size={4}>
                                <TextField
                                    label="Max Guests"
                                    type="number"
                                    fullWidth
                                    value={form.maxGuests}
                                    error={!!errors.maxGuests}
                                    helperText={errors.maxGuests}
                                    onChange={(e) => handleChange("maxGuests", +e.target.value)}
                                />
                            </Grid>
                            <Grid size={4}>
                                <TextField
                                    select
                                    label="Pricing Mode"
                                    fullWidth
                                    value={form.pricingMode}
                                    onChange={(e) => handleChange("pricingMode", e.target.value)}
                                >
                                    <MenuItem value="FIXED">Fixed</MenuItem>
                                    <MenuItem value="PER_NIGHT">Per Night</MenuItem>
                                    <MenuItem value="PER_PERSON">Per Person</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>

                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid size={12}>
                                <TextField
                                    label="Description"
                                    fullWidth
                                    multiline
                                    minRows={3}
                                    value={form.description}
                                    error={!!errors.description}
                                    helperText={errors.description}
                                    onChange={(e) => handleChange("description", e.target.value)}
                                />
                            </Grid>
                        </Grid>

                        {/* Amenities Multi-select */}
                        <FormControl fullWidth sx={{ mt: 3 }}>
                            <InputLabel id="amenities-label">Amenities</InputLabel>
                            <Select
                                labelId="amenities-label"
                                multiple
                                value={form.amenities || []}
                                onChange={(e) =>
                                    setForm((prev) => ({
                                        ...prev,
                                        amenities: e.target.value as string[],
                                    }))
                                }
                                renderValue={(selected) => {
                                    const names = allAmenities
                                        .filter((a) => selected.includes(a.id))
                                        .map((a) => a.name);
                                    return names.join(", ");
                                }}
                            >
                                {allAmenities.map((amenity) => (
                                    <MenuItem key={amenity.id} value={amenity.id}>
                                        <Checkbox checked={form.amenities?.includes(amenity.id)} />
                                        <ListItemText primary={amenity.name} />
                                    </MenuItem>as ReactElement
                                ))}
                            </Select>
                        </FormControl>

                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid item size={12}>
                                <Box sx={{ display: "flex", justifyContent: "center" }}>
                                    <Button
                                        variant="outlined"
                                        component="label"
                                        sx={{
                                            p: 2,
                                            borderStyle: "dashed",
                                            fontSize: "0.9rem",
                                        }}
                                    >
                                        Drag & drop or click to select photos
                                        <input
                                            type="file"
                                            hidden
                                            multiple
                                            accept="image/*"
                                            onChange={handleFileDrop}
                                        />
                                    </Button>
                                </Box>
                            </Grid>
                        </Grid>


                        {/* Preview svih slika (postojeće + nove) */}
                        <Box
                            sx={{
                                mt: 2,
                                display: "grid",
                                gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                                gap: 2,
                            }}
                        >
                            {/* Postojeće slike */}
                            {form.photos.map((url, idx) => (

                                <Box
                                    key={`existing-${idx}`}
                                    sx={{
                                        position: "relative",
                                        width: 160,
                                        height: 120,
                                    }}
                                >
                                    <img
                                        src={url}
                                        alt={`existing-${idx}`}
                                        width={160}
                                        height={120}
                                        style={{
                                            objectFit: "cover",
                                            borderRadius: 8,
                                        }}
                                    />
                                    <Button
                                        size="small"
                                        onClick={() =>
                                            setForm((prev) => ({
                                                ...prev,
                                                photos: prev.photos.filter((_, i) => i !== idx),
                                            }))
                                        }
                                        sx={{
                                            position: "absolute",
                                            top: 4,
                                            right: 4,
                                            minWidth: 0,
                                            width: 24,
                                            height: 24,
                                            borderRadius: "50%",
                                            backgroundColor: "rgba(0,0,0,0.6)",
                                            color: "#fff",
                                            "&:hover": {
                                                backgroundColor: "rgba(0,0,0,0.8)",
                                            },
                                        }}
                                    >
                                        ✕
                                    </Button>
                                </Box> as ReactElement
                            ))}

                            {/* Nove slike */}
                            {localPhotos.map((file, idx) => (
                                <Box
                                    key={`new-${idx}`}
                                    sx={{
                                        position: "relative",
                                        width: 160,
                                        height: 120,
                                    }}
                                >
                                    <img
                                        src={URL.createObjectURL(file)}
                                        alt={`new-${idx}`}
                                        width={160}
                                        height={120}
                                        style={{
                                            objectFit: "cover",
                                            borderRadius: 8,
                                        }}
                                    />
                                    <Button
                                        size="small"
                                        onClick={() =>
                                            setLocalPhotos((prev) =>
                                                prev.filter((_, i) => i !== idx)
                                            )
                                        }
                                        sx={{
                                            position: "absolute",
                                            top: 4,
                                            right: 4,
                                            minWidth: 0,
                                            width: 24,
                                            height: 24,
                                            borderRadius: "50%",
                                            backgroundColor: "rgba(0,0,0,0.6)",
                                            color: "#fff",
                                            "&:hover": {
                                                backgroundColor: "rgba(0,0,0,0.8)",
                                            },
                                        }}
                                    >
                                        ✕
                                    </Button>
                                </Box> as ReactElement
                            ))}
                        </Box>


                        <Box
                            sx={{
                                mt: 4,
                                display: "flex",
                                justifyContent: "flex-end",
                                gap: 2,
                            }}
                        >

                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={form.autoConfirm}
                                        onChange={(e) => handleChange("autoConfirm", e.target.checked)}
                                    /> as ReactElement
                                }
                                label="Auto Confirm"
                            />


                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleSubmit}
                                disabled={loading}
                                sx={{ minWidth: 180, height: 40, position: "relative" }}
                            >
                                {loading ? (
                                    <CircularProgress size={24} sx={{ color: "white" }} />as ReactElement
                                ) : (
                                    "Update Accommodation"
                                )}
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Container>

            <Snackbar
                open={success}
                autoHideDuration={1000}
                onClose={() => setSuccess(false)}
                message="Accommodation updated successfully!"
            />
        </>
    );
}
