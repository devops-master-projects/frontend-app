import { useState } from "react";
import {
    Card,
    CardContent,
    CardMedia,
    Typography,
    CardActions,
    Button,
    MobileStepper,
} from "@mui/material";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";
import SwipeableViews from "react-swipeable-views";
import type { AccommodationResponseDto } from "../api/accommodationsApi";

type Props = { accommodation: AccommodationResponseDto };

export default function AccommodationCard({ accommodation }: Props) {
    const [activeStep, setActiveStep] = useState(0);
    const maxSteps = accommodation.urlPhotos?.length ?? 0;

    return (
        <Card sx={{ maxWidth: 350 }}>
            {maxSteps > 0 && (
                <>
                    <SwipeableViews
                        index={activeStep}
                        onChangeIndex={setActiveStep}
                        enableMouseEvents
                    >
                        {accommodation.urlPhotos.map((photoUrl, idx) => (
                            <CardMedia
                                key={idx}
                                component="img"
                                sx={{ height: 250 }}
                                image={photoUrl}
                                title={`${accommodation.name} - slika ${idx + 1}`}
                            />
                        ))}
                    </SwipeableViews>

                    {maxSteps > 1 && (
                        <MobileStepper
                            steps={maxSteps}
                            position="static"
                            activeStep={activeStep}
                            nextButton={
                                <Button
                                    size="small"
                                    onClick={() => setActiveStep((prev) => prev + 1)}
                                    disabled={activeStep === maxSteps - 1}
                                >
                                    Next <KeyboardArrowRight />
                                </Button>
                            }
                            backButton={
                                <Button
                                    size="small"
                                    onClick={() => setActiveStep((prev) => prev - 1)}
                                    disabled={activeStep === 0}
                                >
                                    <KeyboardArrowLeft /> Back
                                </Button>
                            }
                        />
                    )}
                </>
            )}

            <CardContent>
                <Typography gutterBottom variant="h6">
                    {accommodation.name}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {accommodation.location.city}, {accommodation.location.country}
                </Typography>
                <Typography
                    variant="body2"
                    sx={{
                        mt: 1,
                        color: "text.secondary",
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                    }}
                >
                    {accommodation.description || "No description..."}
                </Typography>

            </CardContent>

            <CardActions>
                <Button size="small">DETAILS</Button>
            </CardActions>
        </Card>
    );
}
