import {useEffect, useState} from "react";
import type {ReactElement}  from "react";
import {
    Box,
    Typography,
    List,
    ListItem,
    Paper,
    ListItemButton,
    ListItemText,
    Checkbox,
    Button,
    Chip,
    Divider,
    ListItemSecondaryAction,

} from "@mui/material";
import { useNavigate } from "react-router-dom";
import { connectWebSocket, disconnectWebSocket } from "../api/websocket.ts";
import type { NotificationDto } from "../api/notificationsApi.ts";
import {getRole, getUserInfoFromToken} from "../../auth/api/authApi.ts";
import {
    getUserNotifications,
    markAllAsRead,
    markAsRead,
    markSelectedAsRead,
    deleteNotificationsBulk
} from "../api/notificationsApi.ts";
import HostNavbar from "../../accommodations/navbar/HostNavbar.tsx";
import GuestNavbar from "../../accommodations/navbar/GuestNavbar.tsx";

export default  function  NotificationsPage()  {
    const [notifications, setNotifications] = useState<NotificationDto[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const navigate = useNavigate();
    const userInfo = getUserInfoFromToken();
    const role : string = getRole();

    // WebSocket konekcija
    useEffect(() => {
        if (!userInfo?.id) return;

        connectWebSocket(userInfo.id, (notif) => {
            setNotifications((prev) => [notif, ...prev]);
        });

        return () => disconnectWebSocket();
    }, [userInfo?.id]);

    // Fetch postojećih notifikacija
    useEffect(() => {
        getUserNotifications()
            .then((data) => setNotifications(data))
            .catch((err) => console.error("Failed to fetch notifications", err));
    }, []);

    const toggleSelect = (id: string) => {
        setSelected((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selected.size === notifications.length) {
            setSelected(new Set());
        } else {
            setSelected(new Set(notifications.map((n) => n.id)));
        }
    };

    const handleMarkAllAsRead = async () => {
        try {
            await markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
            setSelected(new Set());
        } catch (e) {
            console.error("Failed to mark all as read", e);
        }
    };

    const handleMarkSelectedAsRead = async () => {
        try {
            await markSelectedAsRead(Array.from(selected));  // ✅ koristi bulk API
            setNotifications((prev) =>
                prev.map((n) => (selected.has(n.id) ? { ...n, read: true } : n))
            );
            setSelected(new Set());
        } catch (e) {
            console.error("Failed to mark selected as read", e);
        }
    };

    const handleDeleteSelected = async () => {
        try {
            await deleteNotificationsBulk(Array.from(selected)); // ✅ koristi bulk API
            setNotifications((prev) => prev.filter((n) => !selected.has(n.id)));
            setSelected(new Set());
        } catch (e) {
            console.error("Failed to delete selected", e);
        }
    };


    const handleOpen = async (id: string) => {
        try {
            const notif = notifications.find((n) => n.id === id);
            if (notif?.read) {
                navigate(`/notifications/${id}`);
                return;
            }
            await markAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, read: true } : n))
            );

            navigate(`/notifications/${id}`);
        } catch (e) {
            console.error("Failed to mark as read", e);
        }
    };


    return (
        <>
            {role === "HOST" && <HostNavbar /> as ReactElement}
            {role === "GUEST" && <GuestNavbar /> as ReactElement}
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <Paper sx={{ p: 3, width: "100%", maxWidth: "1400px" }}>
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Box display="flex" alignItems="center" gap={2}>
                            <Checkbox
                                checked={selected.size === notifications.length && notifications.length > 0}
                                indeterminate={selected.size > 0 && selected.size < notifications.length}
                                onChange={toggleSelectAll}
                            />
                            <Typography variant="h5">Notifications</Typography>
                        </Box>
                        <Box display="flex" gap={2}>
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={handleMarkAllAsRead}
                                disabled={notifications.length === 0}
                            >
                                Mark All as Read
                            </Button>
                            <Button
                                variant="outlined"
                                color="primary"
                                onClick={handleMarkSelectedAsRead}
                                disabled={selected.size === 0}
                            >
                                Mark Selected as Read
                            </Button>
                            <Button
                                variant="outlined"
                                color="error"
                                onClick={handleDeleteSelected}
                                disabled={selected.size === 0}
                            >
                                Delete Selected
                            </Button>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <List>
                        {notifications.map((notif) => (
                            <ListItem key={notif.id} disablePadding>
                                <ListItemButton
                                    onClick={() => handleOpen(notif.id)}
                                    sx={{
                                        bgcolor: notif.read ? "transparent" : "rgba(25, 118, 210, 0.08)",
                                        fontWeight: notif.read ? "normal" : "bold",
                                    }}
                                >
                                    <Checkbox
                                        checked={selected.has(notif.id)}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleSelect(notif.id);
                                        }}
                                    />
                                    <ListItemText
                                        primary={
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Typography
                                                    variant="body1"
                                                    fontWeight={notif.read ? "normal" : "bold"}
                                                >
                                                    {notif.message}
                                                </Typography>
                                                {!notif.read && <Chip label="New" color="primary" size="small" />}
                                            </Box> as ReactElement
                                        }
                                        secondary={new Date(notif.createdAt).toLocaleString()}
                                    />
                                    <ListItemSecondaryAction>
                                        {/* ovde može i pojedinačni delete dugmić ako želiš */}
                                    </ListItemSecondaryAction>
                                </ListItemButton>
                            </ListItem> as ReactElement
                        ))}

                        {notifications.length === 0 && (
                            <Typography variant="body1" sx={{ textAlign: "center", mt: 3 }}>
                                No notifications found
                            </Typography> as ReactElement
                        )}
                    </List>
                </Paper>
            </Box>
        </>
    );
};
