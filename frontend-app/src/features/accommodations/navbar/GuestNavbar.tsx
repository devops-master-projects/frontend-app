

import {
    AppBar,
    Toolbar,
    Typography,
    Box,
    IconButton,
    Collapse,
    TextField,
    Button,
    Popover,
    List,
    ListItem, Switch, ListItemText, Tooltip
} from "@mui/material";
import {Link as RouterLink, useNavigate} from "react-router-dom";
import {Home, Notifications, Search} from "@mui/icons-material";
import {useEffect, useState} from "react";
import {DatePicker, LocalizationProvider} from "@mui/x-date-pickers";
import {AdapterDateFns} from "@mui/x-date-pickers/AdapterDateFns";
import type {ReactElement} from "react";
import {
    fetchNotificationSettings,
    updateNotificationSetting
} from "../../notifications/api/notificationsApi.ts";
import type {NotificationSettingsDto} from "../../notifications/api/notificationsApi.ts";
import LogoutIcon from "@mui/icons-material/Logout";
import {logout} from "../../auth/api/authApi.ts";

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


export default function GuestNavbar({ onSearch, onHome, enableSearch = false }: GuestNavBarProps) {
    const [showSearch, setShowSearch] = useState(false);
    const [location, setLocation] = useState("");
    const [guests, setGuests] = useState(1);
    const [startDate, setStartDate] = useState<Date | null>(null);
    const [endDate, setEndDate] = useState<Date | null>(null);
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [settings, setSettings] = useState<NotificationSettingsDto[]>([]);

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
    const handleLogout = () => {
        logout();
        navigate("/");
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


    const handleHomeClick = () => {
        if (onHome) {
            onHome(); // koristi custom logiku iz AccommodationDashboard
        } else {
            navigate("/accommodations"); // fallback za sve druge stranice
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
                    <Button
                        component={RouterLink}
                        to="/notifications"
                        color="inherit"
                        sx={{ fontWeight: 600 }}
                    >
                        Notifications
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

                <Box sx={{ marginLeft: "auto" }}>
                    { enableSearch && (
                        <IconButton
                            color="inherit"
                            onClick={() => setShowSearch((prev) => !prev)}
                        >
                            <Search />
                        </IconButton> as ReactElement
                    )}
                    {/* Notifications dugme */}
                    <IconButton
                        color="inherit"
                        onClick={(e) => setAnchorEl(e.currentTarget)}
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
