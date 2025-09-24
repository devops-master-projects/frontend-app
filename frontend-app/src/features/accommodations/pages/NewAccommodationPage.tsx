import {useEffect, useState} from "react";
import {
    Container,
    Typography,
    TextField,
    Paper,
    Box,
    Button,
    Checkbox,
    FormControlLabel,
    MenuItem, Snackbar,
    FormControl,
    InputLabel,
    Select,
    ListItemText,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import type { AccommodationRequestDto } from "../api/accommodationsApi";
import HostNavbar from "../navbar/HostNavbar.tsx";
import Grid from "@mui/material/Grid";
import {createAccommodation, uploadPhotoToCloudinary} from "../api/accommodationsApi";
import {useNavigate} from "react-router-dom";
import CircularProgress from "@mui/material/CircularProgress";
import type {AmenityResponseDto} from "../api/amenitiesApi.ts";
import {fetchAmenities} from "../api/amenitiesApi.ts";

export default function NewAccommodationPage() {
    const theme = useTheme();

    const [form, setForm] = useState<AccommodationRequestDto>({
        hostId: "9e1f97cc-73d5-44ba-a4d1-7ad0c1373d39", // TODO
        name: "",
        location: { country: "", city: "", address: "", postalCode: "" },
        minGuests: 1,
        maxGuests: 1,
        description: "",
        autoConfirm: false,
        pricingMode: "FIXED",
        photos: [],
        amenities: []
    });

    const [localPhotos, setLocalPhotos] = useState<File[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const navigate = useNavigate();

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


    const [allAmenities, setAllAmenities] = useState<AmenityResponseDto[]>([]);

    useEffect(() => {
        fetchAmenities().then(setAllAmenities).catch(console.error);
    }, []);


    const handleSubmit = async () => {
        const newErrors: Record<string, string> = {};

        // validacija
        if (!form.name.trim()) newErrors.name = "Name is required";
        if (!form.location.country.trim()) newErrors.country = "Country is required";
        if (!form.location.city.trim()) newErrors.city = "City is required";
        if (!form.location.address.trim()) newErrors.address = "Address is required";
        if (!form.location.postalCode.trim()) newErrors.postalCode = "Postal code is required";
        if (form.minGuests < 1) newErrors.minGuests = "Minimum guests must be at least 1";
        if (form.maxGuests < form.minGuests) newErrors.maxGuests = "Max guests must be greater than min guests";
        if (!form.description.trim()) newErrors.description = "Description is required";
        if (localPhotos.length === 0) newErrors.photos = "At least one photo is required";

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        try {
            setLoading(true);

            // Upload slika
            const uploadedUrls = await Promise.all(
                localPhotos.map((file) => uploadPhotoToCloudinary(file))
            );

            // Request ka backendu
            const request = { ...form, photos: uploadedUrls };
            console.log("request: ", request);
            await createAccommodation(request);

            setSuccess(true);
            setTimeout(() => {
                navigate("/accommodations");
            }, 2000);
        } catch (err) {
            console.error("Error saving accommodation:", err);
        } finally {
            setLoading(false);
        }
    };


    return (
        <>
            <HostNavbar />
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
                        Create New Accommodation
                    </Typography>

                    <Box component="form" sx={{ mt: 3 }}>
                        {/* Row 1: Name + Country */}
                        <Grid container spacing={2}>
                            <Grid size={12}>
                                <TextField
                                    label="Name"
                                    fullWidth
                                    value={form.name}
                                    error={Boolean(errors.name)}
                                    helperText={errors.name}
                                    onChange={(e) => handleChange("name", e.target.value)}
                                />
                            </Grid>
                            <Grid size={12}>
                                <TextField
                                    label="Country"
                                    fullWidth
                                    value={form.location.country}
                                    error={Boolean(errors.country)}
                                    helperText={errors.country}
                                    onChange={(e) => handleLocationChange("country", e.target.value)}
                                />
                            </Grid>
                        </Grid>

                        {/* Row 2: City + Address + Postal Code */}
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    label="City"
                                    fullWidth
                                    value={form.location.city}
                                    error={Boolean(errors.city)}
                                    helperText={errors.city}
                                    onChange={(e) => handleLocationChange("city", e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    label="Address"
                                    fullWidth
                                    value={form.location.address}
                                    error={Boolean(errors.address)}
                                    helperText={errors.address}
                                    onChange={(e) => handleLocationChange("address", e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    label="Postal Code"
                                    fullWidth
                                    value={form.location.postalCode}
                                    error={Boolean(errors.postalCode)}
                                    helperText={errors.postalCode}
                                    onChange={(e) =>
                                        handleLocationChange("postalCode", e.target.value)
                                    }
                                />
                            </Grid>
                        </Grid>

                        {/* Row 3: Min Guests + Max Guests + Pricing */}
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    label="Min Guests"
                                    type="number"
                                    fullWidth
                                    value={form.minGuests}
                                    error={Boolean(errors.minGuests)}
                                    helperText={errors.minGuests}
                                    onChange={(e) => handleChange("minGuests", +e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    label="Max Guests"
                                    type="number"
                                    fullWidth
                                    value={form.maxGuests}
                                    error={Boolean(errors.maxGuests)}
                                    helperText={errors.maxGuests}
                                    onChange={(e) => handleChange("maxGuests", +e.target.value)}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, md: 4 }}>
                                <TextField
                                    select
                                    label="Pricing Mode"
                                    fullWidth
                                    value={form.pricingMode}
                                    error={Boolean(errors.pricingMode)}
                                    helperText={errors.pricingMode}
                                    onChange={(e) => handleChange("pricingMode", e.target.value)}
                                >
                                    <MenuItem value="FIXED">Fixed</MenuItem>
                                    <MenuItem value="PER_NIGHT">Per Night</MenuItem>
                                    <MenuItem value="PER_PERSON">Per Person</MenuItem>
                                </TextField>
                            </Grid>
                        </Grid>

                        {/* Row 4: Description */}
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid size={12}>
                                <TextField
                                    label="Description"
                                    fullWidth
                                    multiline
                                    minRows={3}
                                    value={form.description}
                                    error={Boolean(errors.description)}
                                    helperText={errors.description}
                                    onChange={(e) => handleChange("description", e.target.value)}
                                />
                            </Grid>
                        </Grid>

                        {/* Amenities */}
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
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        {/* File Upload */}
                        <Grid container spacing={2} sx={{ mt: 2 }}>
                            <Grid size={12}>
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

                                {/* Preview */}
                                <Box
                                    sx={{
                                        mt: 2,
                                        display: "grid",
                                        gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))",
                                        gap: 2,
                                    }}
                                >
                                    {localPhotos.map((file, idx) => (
                                        <Box
                                            key={idx}
                                            sx={{
                                                position: "relative",
                                                width: 160,
                                                height: 120,
                                            }}
                                        >
                                            <img
                                                src={URL.createObjectURL(file)}
                                                alt={`preview-${idx}`}
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
                                        </Box>
                                    ))}
                                </Box>
                            </Grid>
                        </Grid>

                        {/* Bottom Actions */}
                        <Box
                            sx={{
                                mt: 4,
                                display: "flex",
                                justifyContent: "flex-end",
                                alignItems: "center",
                                gap: 2,
                            }}
                        >
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        checked={form.autoConfirm}
                                        onChange={(e) =>
                                            handleChange("autoConfirm", e.target.checked)
                                        }
                                    />
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
                                    <CircularProgress size={24} sx={{ color: "white" }} />
                                ) : (
                                    "Save Accommodation"
                                )}
                            </Button>
                        </Box>
                    </Box>
                </Paper>
            </Container>
            <Snackbar
                open={success}
                autoHideDuration={3000}
                onClose={() => setSuccess(false)}
                message="Accommodation created successfully!"
            />
        </>

    );


}
