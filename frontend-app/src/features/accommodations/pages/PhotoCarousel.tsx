import { useState } from "react";
import {
    Box,
    Button,
    MobileStepper,
    CardMedia,
} from "@mui/material";
import { KeyboardArrowLeft, KeyboardArrowRight } from "@mui/icons-material";
import SwipeableViews from "react-swipeable-views";

type Props = {
    photos: string[];
    name: string;
};

export default function PhotoCarousel({ photos, name }: Props) {
    const [activeStep, setActiveStep] = useState(0);
    const maxSteps = photos.length;

    const handleNext = () => {
        setActiveStep((prev) => (prev + 1) % maxSteps);
    };

    const handleBack = () => {
        setActiveStep((prev) => (prev - 1 + maxSteps) % maxSteps);
    };

    const handleStepChange = (step: number) => {
        setActiveStep(step);
    };

    if (maxSteps === 0) return null;

    return (
        <Box sx={{ mt: 5 }}>
            <SwipeableViews
                index={activeStep}
                onChangeIndex={handleStepChange}
                enableMouseEvents
            >
                {photos.map((photoUrl, idx) => (
                    <CardMedia
                        key={idx}
                        component="img"
                        sx={{ height: 450, borderRadius: 2 }}
                        image={photoUrl}
                        title={`${name} - slika ${idx + 1}`}
                    />
                ))}
            </SwipeableViews>

            {maxSteps > 1 && (
                <MobileStepper
                    steps={maxSteps}
                    position="static"
                    activeStep={activeStep}
                    nextButton={
                        <Button size="small" onClick={handleNext}>
                            Next <KeyboardArrowRight />
                        </Button>
                    }
                    backButton={
                        <Button size="small" onClick={handleBack}>
                            <KeyboardArrowLeft /> Back
                        </Button>
                    }
                />
            )}
        </Box>
    );
}
