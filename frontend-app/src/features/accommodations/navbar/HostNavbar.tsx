



import {
    AppBar,
    Toolbar,
    Button,
    Box,
    IconButton,
    Collapse,
    TextField,
    ListItemText,
    Switch,
    ListItem, List, Tooltip
} from "@mui/material";
import {Link as RouterLink, useNavigate} from "react-router-dom";
import { Home } from "@mui/icons-material";
import {useEffect, useState} from "react";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import type {ReactElement} from "react";
import {
    Popover
} from "@mui/material";
import { Search, Notifications } from "@mui/icons-material";
import {fetchNotificationSettings, updateNotificationSetting} from "../../notifications/api/notificationsApi.ts";
import type {NotificationSettingsDto} from "../../notifications/api/notificationsApi.ts";
type HostNavbarProps = {
    onSearch?: (filters: {
        location: string;
        guests: number;
        startDate?: string;
        endDate?: string;
    }) => void;
    onHome?: () => void;
    enableSearch?: boolean;
};
import LogoutIcon from "@mui/icons-material/Logout";
import {logout} from "../../auth/api/authApi.ts";
export default function HostNavbar({ onSearch, onHome, enableSearch = false }: HostNavbarProps) {
    const [showSearch, setShowSearch] = useState(false);
    const [location, setLocation] = useState("");
    const [guests, setGuests] = useState(1);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [settings, setSettings] = useState<NotificationSettingsDto[]>([]);

    const navigate = useNavigate();

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

    const handleHomeClick = () => {
        if (onHome) {
            onHome();
        } else {
            navigate("/accommodations");
        }
    };

    const handleToggle = (notifType: string) => {
        setSettings((prev) =>
            prev.map((s) =>
                s.notifType === notifType ? { ...s, enabled: !s.enabled } : s
            )
        );

        const updated = settings.find((s) => s.notifType === notifType);
        if (updated) {
            updateNotificationSetting(notifType, !updated.enabled)
                .then((newSetting) => {
                    console.log("Updated setting:", newSetting);
                })
                .catch((err) => {
                    console.error("Failed to update setting", err);
                });
        }
    };


    useEffect(() => {
        fetchNotificationSettings()
            .then(setSettings)
            .catch((err) => console.error("Failed to load notification settings", err));
    }, []);

    const handleLogout = () => {
        logout();
        navigate("/");
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
                {/* Leva strana */}
                <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
                    <IconButton
                        color="inherit"
                        onClick={handleHomeClick}
                        data-testid="host-navbar-home"
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
                    <Button
                        component={RouterLink}
                        to="/notifications"
                        color="inherit"
                        sx={{ fontWeight: 600 }}
                    >
                        Notifications
                    </Button>
                </Box>

                {/* Desna strana */}

                <Box sx={{ marginLeft: "auto", display: "flex", gap: 1 }}>
                    {enableSearch && (

                        <IconButton
                            color="inherit"
                            onClick={() => setShowSearch((prev) => !prev)}
                            data-testid="host-navbar-toggle-search"
                        >
                            <Search />
                        </IconButton>  as ReactElement
                    )}
                    {/* Notifications dugme */}
                    <IconButton
                        color="inherit"
                        onClick={(e) => setAnchorEl(e.currentTarget)}
                        data-testid="host-navbar-open-notifications"
                    >
                        <Notifications />
                    </IconButton>

                    <Tooltip title="Logout">
                        <IconButton color="inherit" onClick={handleLogout}>
                            <LogoutIcon />
                        </IconButton>
                    </Tooltip>
                    <Popover
                        open={Boolean(anchorEl)}
                        anchorEl={anchorEl}
                        onClose={() => setAnchorEl(null)}
                        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                        transformOrigin={{ vertical: "top", horizontal: "right" }}
                    >
                        <List sx={{ minWidth: 250 }}>
                            {settings.map((s) => (
                                <ListItem
                                    key={s.notifType}
                                    secondaryAction={
                                        <Switch
                                            edge="end"
                                            checked={s.enabled}
                                            onChange={() => handleToggle(s.notifType)}
                                        /> as ReactElement
                                    }
                                >
                                    <ListItemText
                                        primary={s.notifType.replaceAll("_", " ")}
                                    />
                                </ListItem> as ReactElement
                            ))}
                        </List>
                    </Popover>
                </Box>

            </Toolbar>

            {/* Search forma koja se pojavi ispod */}
            {enableSearch && (
<<<<<<< HEAD
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
                        <Button variant="contained" onClick={handleSearch} data-testid="host-navbar-submit-search">
                            Search
                        </Button>
                    </Box>
                </Collapse>
            </LocalizationProvider>) as ReactElement
=======
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
>>>>>>> e5fa102dd108aa3735ed64ba6507e581c3d30e0a
            }
        </AppBar>
    );
}
