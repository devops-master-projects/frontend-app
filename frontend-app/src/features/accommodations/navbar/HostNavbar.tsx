import { AppBar, Toolbar, Typography, Button, Box, IconButton } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { Home } from "@mui/icons-material";

export default function HostNavbar() {
    return (
        <AppBar
            position="static"
            color="primary"
            elevation={1}
            sx={{
                borderBottom: "3px solid",
                borderColor: "secondary.main",
            }}
        >
            <Toolbar sx={{ position: "relative" }}>
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <IconButton
                        component={RouterLink}
                        to="/accommodations"
                        color="inherit"
                        sx={{ fontWeight: 600 }}
                    >
                        <Home />
                    </IconButton>

                    <Button
                        component={RouterLink}
                        to="/accommodations/new"
                        color="inherit"
                        sx={{ fontWeight: 600 }}
                    >
                        New Accommodation
                    </Button>

                    <Button
                        component={RouterLink}
                        to="/accommodations/amenity/new"
                        color="inherit"
                        sx={{ fontWeight: 600 }}
                    >
                        New Amenity
                    </Button>
                </Box>
                <Typography
                    variant="h6"
                    component="div"
                    sx={{
                        position: "absolute",
                        left: "50%",
                        transform: "translateX(-50%)",
                        fontWeight: 700,
                        letterSpacing: "-0.5px",
                        color: "primary.contrastText",
                    }}
                >

                </Typography>
            </Toolbar>
        </AppBar>
    );
}
