import { useEffect, useState} from "react";
import type {ReactElement} from "react";
import {
    Box,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Switch,
    FormControlLabel,
    Chip,
} from "@mui/material";
import { useParams } from "react-router-dom";
import {
    getReservationRequestsByAccommodation, updateReservationRequestStatus,
} from "../api/bookingApi";
import type { ReservationRequestResponseDto } from "../api/bookingApi";
import HostNavbar from "../../accommodations/navbar/HostNavbar.tsx";
import {getAutoConfirm, updateAutoConfirm} from "../../accommodations/api/accommodationsApi.ts";

export default function HostAccommodationRequestsPage() {
    const { id } = useParams<{ id: string }>();
    const [requests, setRequests] = useState<ReservationRequestResponseDto[]>([]);
    const [autoApprove, setAutoApprove] = useState(false);
    useEffect(() => {
        if (!id) return;
        getReservationRequestsByAccommodation(id)
            .then((data) => setRequests(data))
            .catch((err) => console.error("Failed to load requests:", err));

        getAutoConfirm(id)
            .then((value) => setAutoApprove(value))
            .catch((err) => console.error("Failed to load autoConfirm:", err));
    }, [id]);

    async function refreshRequests() {
        if (!id) return;
        try {
            const data = await getReservationRequestsByAccommodation(id);
            setRequests(data);
        } catch (err) {
            console.error("Failed to load requests:", err);
        }
    }

    const getStatusChip = (status: ReservationRequestResponseDto["status"]) => {
        switch (status) {
            case "APPROVED":
                return <Chip label="Approved" color="success" />;
            case "REJECTED":
                return <Chip label="Rejected" color="error" />;
            case "CANCELLED":
                return <Chip label="Cancelled" color="warning" />;
            case "PENDING":
            default:
                return <Chip label="Pending" color="info" />;
        }
    };

    const handleChange = async (checked: boolean) => {
        try {

            setAutoApprove(checked);
            await updateAutoConfirm(id ?? "", checked);
        } catch (err) {
            console.error("Failed to update autoConfirm:", err); // rollback ako padne
        }
    };

    return (
        <>
        <HostNavbar/>
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <Paper sx={{ p: 3, width: "100%", maxWidth: "1200px" }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <Typography variant="h5" gutterBottom>
                        Reservation Requests
                    </Typography>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={autoApprove}
                                onChange={(e) => handleChange(e.target.checked)}
                                color="primary"
                            /> as ReactElement
                        }
                        label="Auto-approve new requests"
                    />
                </Box>

                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell><b>Created At</b></TableCell>
                                <TableCell><b>Guest</b></TableCell>
                                <TableCell><b>Email</b></TableCell>
                                <TableCell><b>Guest Count</b></TableCell>
                                <TableCell><b>Period</b></TableCell>
                                <TableCell><b>Cancellations count</b></TableCell>
                                <TableCell><b>Status</b></TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {requests.map((r) => (
                                <TableRow key={r.id}>
                                    <TableCell>{new Date(r.createdAt).toLocaleString()}</TableCell>
                                    <TableCell>{r.guestFirstName} {r.guestLastName}</TableCell>
                                    <TableCell>{r.guestEmail ?? "—"}</TableCell>
                                    <TableCell>{r.guestCount}</TableCell>
                                    <TableCell>
                                        {new Date(r.startDate).toLocaleDateString()} –{" "}
                                        {new Date(r.endDate).toLocaleDateString()}
                                    </TableCell>
                                    <TableCell>{r.cancellationsCount}</TableCell>
                                    <TableCell>
                                        {getStatusChip(r.status)}
                                    </TableCell>
                                    <TableCell>
                                        {r.status === "PENDING" && (
                                            <>
                                                <Chip
                                                    label="Approve"
                                                    color="success"
                                                    onClick={async () => {
                                                        try {
                                                            await updateReservationRequestStatus(r.id, "APPROVED");
                                                            await refreshRequests();
                                                        } catch (err) {
                                                            console.error("Failed to approve:", err);
                                                        }
                                                    }}
                                                    sx={{ mr: 1, cursor: "pointer" }}
                                                />
                                                <Chip
                                                    label="Reject"
                                                    color="error"
                                                    onClick={async () => {
                                                        try {
                                                            await updateReservationRequestStatus(r.id, "REJECTED");
                                                            await refreshRequests()
                                                        } catch (err) {
                                                            console.error("Failed to reject:", err);
                                                        }
                                                    }}
                                                    sx={{ cursor: "pointer" }}
                                                />
                                            </> as ReactElement
                                        )}
                                    </TableCell>
                                </TableRow> as ReactElement
                            ))}
                            {requests.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={7} align="center">
                                        No requests found
                                    </TableCell>
                                </TableRow> as ReactElement
                            )}
                        </TableBody>

                    </Table>
                </TableContainer>
            </Paper>
        </Box>
        </>
    );
}
