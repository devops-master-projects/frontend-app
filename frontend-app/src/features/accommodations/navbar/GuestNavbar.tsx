import { AppBar, Toolbar, Typography, Button, Box, IconButton } from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { Home } from "@mui/icons-material";

export default function GuestNavbar() {
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
