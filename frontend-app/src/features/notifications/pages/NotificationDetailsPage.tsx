import { useEffect, useState} from "react";
import { useParams } from "react-router-dom";
import type {ReactElement} from "react";
import {
    Box,
    Typography,
    CircularProgress,
    Paper,
    Divider,
    Chip,
} from "@mui/material";
import type { NotificationDto } from "../api/notificationsApi.ts";
import { getNotificationById } from "../api/notificationsApi.ts";
import HostNavbar from "../../accommodations/navbar/HostNavbar.tsx";
import GuestNavbar from "../../accommodations/navbar/GuestNavbar.tsx";
import {getRole} from "../../auth/api/authApi.ts";

export default function NotificationDetailsPage() {
    const { id } = useParams<{ id: string }>();
    const [notification, setNotification] = useState<NotificationDto | null>(null);
    const [loading, setLoading] = useState(true);
    const role : string = getRole();
    useEffect(() => {
        if (!id) return;
        getNotificationById(id)
            .then((notif) => setNotification(notif))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading)
        return (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <CircularProgress />
            </Box>
        );

    if (!notification)
        return (
            <Typography variant="h6" sx={{ textAlign: "center", mt: 4 }}>
                No notification found.
            </Typography>
        );

    return (
        <>
        {role === "HOST" && <HostNavbar /> as ReactElement}
        {role === "GUEST" && <GuestNavbar /> as ReactElement}
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <Paper sx={{ p: 4, width: "100%", maxWidth: "800px" }}>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                    }}
                >
                    <Typography variant="h5">Notification Details</Typography>
                    {!notification.read && <Chip label="New" color="primary" size="small" />}
                </Box>

                <Divider sx={{ my: 2 }} />

                <Typography variant="body1" sx={{ mb: 2 }}>
                    {notification.message}
                </Typography>

                <Typography variant="body2" color="text.secondary">
                    <strong>Type:</strong> {notification.notifType}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    <strong>Created at:</strong>{" "}
                    {new Date(notification.createdAt).toLocaleString()}
                </Typography>
            </Paper>
        </Box>
        </>
    );
}
