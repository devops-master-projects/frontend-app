import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    IconButton,
    Collapse,
    TextField,
    Button, Tooltip,

} from "@mui/material";
import {useNavigate} from "react-router-dom";
import {Home, Search} from "@mui/icons-material";
import {useState} from "react";
import {DatePicker, LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";
import type {ReactElement} from "react";
import LoginIcon from "@mui/icons-material/Login";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
type GuestNavBarProps = {
    onSearch?: (filters: {
        location: string;
        guests: number;
        startDate?: string;
        endDate?: string;
    }) => void;
    onHome?: () => void;
    enableSearch?: boolean;
};


export default function Navbar({ onSearch, onHome, enableSearch = false }: GuestNavBarProps) {
    const [showSearch, setShowSearch] = useState(false);
    const [location, setLocation] = useState("");
    const [guests, setGuests] = useState(1);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);

    const formatDate = (date: Date | null) => {
        if (!date) return undefined;
        return date.toLocaleDateString("sv-SE"); // yyyy-MM-dd format
    };
    const handleSearch = () => {
        if (onSearch) {
            onSearch({
                location,
                guests,
                startDate: formatDate(startDate),
                endDate: formatDate(endDate),
            });
        }
    };
    const navigate = useNavigate();



    const handleHomeClick = () => {
        if (onHome) {
            onHome();
        } else {
            navigate("/accommodations");
        }
    };


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
                        color="inherit"
                        onClick={handleHomeClick}
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

                <Box sx={{ marginLeft: "auto" }}>
                    { enableSearch && (
                        <IconButton
                            color="inherit"
                            onClick={() => setShowSearch((prev) => !prev)}
                        >
                            <Search />
                        </IconButton> as ReactElement
                    )}
                    <Tooltip title="Log In">
                        <IconButton color="inherit" onClick={() => navigate("/auth/login")}>
                            <LoginIcon />
                        </IconButton>
                    </Tooltip>

                    <Tooltip title="Sign Up">
                        <IconButton color="inherit" onClick={() => navigate("/auth/register")}>
                            <PersonAddIcon />
                        </IconButton>
                    </Tooltip>
                </Box>

            </Toolbar>
            {enableSearch && (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Collapse in={showSearch} timeout="auto" unmountOnExit>
                        <Box
                            sx={{
                                p: 2,
                                backgroundColor: "background.default",
                                display: "flex",
                                gap: 2,
                                alignItems: "center",
                            }}
                        >
                            <TextField
                                label="Location"
                                value={location}
                                onChange={(e) => setLocation(e.target.value)}
                            />
                            <TextField
                                type="number"
                                label="Guests"
                                value={guests}
                                onChange={(e) => setGuests(Number(e.target.value))}
                                sx={{ width: 120 }}
                            />
                            <DatePicker
                                label="Start Date"
                                value={startDate}
                                onChange={setStartDate}
                                slotProps={{ textField: { sx: { minWidth: 160 } } }}
                            />
                            <DatePicker
                                label="End Date"
                                value={endDate}
                                onChange={setEndDate}
                                slotProps={{ textField: { sx: { minWidth: 160 } } }}
                            />
                            <Button variant="contained" onClick={handleSearch}>
                                Search
                            </Button>
                        </Box>
                    </Collapse>
                </LocalizationProvider>) as ReactElement
            }
        </AppBar>
    );
}
