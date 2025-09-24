import {useState} from "react";
import type {ReactElement} from "react";
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
import SwipeableViews from 'react-swipeable-views';
import type { AccommodationResponseDto } from "../api/accommodationsApi";
import { Link } from "react-router-dom";
import {getRole} from "../../auth/api/authApi.ts";
type Props = { accommodation: AccommodationResponseDto };

export default function AccommodationCard({ accommodation }: Props) {
    const [activeStep, setActiveStep] = useState(0);
    const maxSteps = accommodation.urlPhotos?.length ?? 0;
    const role : string = getRole();

    return (
        <Card sx={{ maxWidth: 350, minHeight: 500, maxHeight: 500}}>
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
                                title={`${accommodation.name} - ${idx + 1}`}></CardMedia> as ReactElement
                        ))}
                    </SwipeableViews>

                    <MobileStepper
                        steps={maxSteps}
                        position="static"
                        activeStep={activeStep}
                        nextButton={
                            <Button
                                size="small"
                                onClick={() => setActiveStep((prev) => prev + 1)}
                                disabled={activeStep === maxSteps - 1 || maxSteps === 1}
                            >
                                Next <KeyboardArrowRight />
                            </Button> as ReactElement
                        }
                        backButton={
                            <Button
                                size="small"
                                onClick={() => setActiveStep((prev) => prev - 1)}
                                disabled={activeStep === 0 || maxSteps === 1}
                            >
                                <KeyboardArrowLeft /> Back
                            </Button> as ReactElement
                        }
                    />
                </> as ReactElement
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
                <Button
                    size="small"
                    component={Link}
                    to={`/accommodations/${accommodation.id}`}
                >
                    DETAILS
                </Button>
                { role === "HOST" &&
                <Button
                    size="small"
                    component={Link}
                    to={`/accommodations/${accommodation.id}/edit`}
                >
                    EDIT
                </Button> as ReactElement
                }

            </CardActions>
        </Card>
    );
}
