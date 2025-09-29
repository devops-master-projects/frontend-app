import { useEffect, useState} from "react";
import type {ReactElement} from "react";
import {
    Calendar,
    momentLocalizer,
    type SlotInfo,
} from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";
import {
    Box,
    Paper,
    Typography,
    Dialog,
    DialogTitle,
    DialogContent,
    TextField,
    DialogActions,
    Button,
} from "@mui/material";
import GuestNavbar from "../../accommodations/navbar/GuestNavbar.tsx";
import {
    cancelReservation,
    createReservationRequest,
    deleteReservationRequest,
    getAvailability,
    getReservationRequestsByGuest, updateReservationRequest
} from "../api/bookingApi.ts";
import { useParams } from "react-router-dom";
import type {AccommodationResponseDto} from "../../accommodations/api/accommodationsApi.ts";
import {fetchAccommodationById} from "../../accommodations/api/accommodationsApi.ts";

type MyEvent = {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource: {
        status: "AVAILABLE" | "RESERVED" | "PENDING" | "APPROVED" | "REJECTED" | "CANCELLED";
    };
    priceType: "NORMAL" | "HOLIDAY" | "SEASONAL" | "WEEKEND";
    price?: number;
    guestCount?: number;
};

const localizer = momentLocalizer(moment);

export default function ReservationsCalendarPage() {
    const [events, setEvents] = useState<MyEvent[]>([]);
    const [open, setOpen] = useState(false);
    const [range, setRange] = useState<{ start: Date; end: Date } | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [newGuestCount, setNewGuestCount] = useState<number>(1);
    const [editTarget, setEditTarget] = useState<MyEvent | null>(null);
    const [confirmDelete, setConfirmDelete] = useState(false);
    const [accommodation, setAccommodation] = useState<AccommodationResponseDto | null>(null);

    const { id } = useParams<{ id: string }>();

    const formatDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

    const normalizeToLocalDay = (d: Date) =>
        new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);

    const toInclusiveStart = (d: string) => {
        const date = new Date(d);
        return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    };
    const [cancelTarget, setCancelTarget] = useState<MyEvent | null>(null);


    useEffect(() => {
        if (!id) return;
        refreshCalendar(id);
    }, [id]);

    async function refreshCalendar(accommodationId: string) {
        const [availability, requests, accommodation] = await Promise.all([
            getAvailability(accommodationId),
            getReservationRequestsByGuest(accommodationId),
            fetchAccommodationById(accommodationId),
        ]);

        setAccommodation(accommodation);

        const mappedAvail: MyEvent[] = availability.map(a => ({
            id: a.id,
            title: a.priceType !== "NORMAL"
                ? `⭐ ${a.priceType} (€${a.price})`
                : `Available (€${a.price})`,
            start: toInclusiveStart(a.startDate),
            end: new Date(
                new Date(a.endDate).getFullYear(),
                new Date(a.endDate).getMonth(),
                new Date(a.endDate).getDate(),
                23, 59, 59, 999
            ),
            allDay: true,
            resource: { status: a.status },
            priceType: a.priceType,
            price: a.price,
        }));

        const mappedReq: MyEvent[] = requests
            .filter(
                (r) => r.status !== "REJECTED" && !r.connectedReservationCancelled
            )
            .map((r) => {
                let title = "Reservation request";
                if (r.status === "APPROVED") {
                    title = "Your reservation!";
                }
                return {
                    id: r.id,
                    title,
                    start: new Date(r.startDate),
                    end: new Date(
                        new Date(r.endDate).getFullYear(),
                        new Date(r.endDate).getMonth(),
                        new Date(r.endDate).getDate(),
                        23, 59, 59, 999
                    ),
                    allDay: true,
                    resource: { status: r.status },
                    priceType: "NORMAL",
                    guestCount: r.guestCount,
                };
            });

        setEvents([...mappedAvail, ...mappedReq]);
    }



    const handleSelectSlot = (slotInfo: SlotInfo) => {
        if (!slotInfo.start || !slotInfo.end) return;

        const start = normalizeToLocalDay(slotInfo.start);
        const rawEnd = normalizeToLocalDay(slotInfo.end);
        const end = new Date(rawEnd.getTime() - 1);

        const days: Date[] = [];
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
            days.push(new Date(d));
        }

        const allAvailable = days.every(day =>
            events.some(ev =>
                ev.resource.status === "AVAILABLE" &&
                day >= normalizeToLocalDay(ev.start) &&
                day <= normalizeToLocalDay(ev.end)
            )
        );

        const hasOverlapWithRequests = days.some(day =>
            events.some(ev =>
                ["PENDING", "APPROVED", "RESERVED"].includes(ev.resource.status) &&
                day >= normalizeToLocalDay(ev.start) &&
                day <= normalizeToLocalDay(ev.end)
            )
        );

        if (!allAvailable || hasOverlapWithRequests) return;

        setRange({ start, end });
        setNewGuestCount(accommodation ? accommodation.minGuests : 1);

        setOpen(true);
    };


    const handleSaveReservation = async () => {
        if (!accommodation)
            return;
        if (!range || !id) return; // id = accommodationId iz useParams
        try {
            const dto = {
                accommodationId: id,
                startDate: formatDate(range.start),
                endDate: formatDate(range.end),
                guestCount: newGuestCount,
            };
            if (newGuestCount < accommodation?.minGuests || newGuestCount > accommodation?.maxGuests)
                return;

            const created = await createReservationRequest( dto);

            const newReservation: MyEvent = {
                id: created.id,
                title: `Reservation request (${created.guestCount} guests)`,
                start: new Date(created.startDate),
                end: new Date(
                    new Date(created.endDate).getFullYear(),
                    new Date(created.endDate).getMonth(),
                    new Date(created.endDate).getDate(),
                    23, 59, 59, 999
                ),
                allDay: true,
                resource: { status: created.status }, // očekuje "PENDING"
                priceType: "NORMAL",
            };

            setEvents((prev) => [...prev, newReservation]);
            setOpen(false);
            await refreshCalendar(id ?? "");

        } catch (err) {
            console.error("Failed to create reservation request:", err);
        }
    };

    const handleSelectEvent = (event: MyEvent) => {
        if (event.resource.status === "PENDING") {
            setEditTarget({
                ...event,
                guestCount: event.guestCount ?? (accommodation ? accommodation.minGuests : 1),
            });
        } else if (event.resource.status === "APPROVED") {
            setCancelTarget(event);
        }
    };


    const handleUpdateReservation = async () => {
        if (!editTarget) return;
        if (!accommodation) return;

        if (!editTarget || editTarget.guestCount == null || !accommodation) return;

        if (
            editTarget.guestCount < accommodation.minGuests ||
            editTarget.guestCount > accommodation.maxGuests
        ) {
            return;
        }


        const days: Date[] = [];
        for (let d = new Date(editTarget.start); d <= editTarget.end; d.setDate(d.getDate() + 1)) {
            days.push(new Date(d));
        }
        const allAvailable = days.every(day =>
            events.some(ev =>
                ev.resource.status === "AVAILABLE" &&
                normalizeToLocalDay(day) >= normalizeToLocalDay(ev.start) &&
                normalizeToLocalDay(day) <= normalizeToLocalDay(ev.end)
            )
        );

        if (!allAvailable)
            return
        try {
            const dto = {
                startDate: formatDate(editTarget.start),
                endDate: formatDate(editTarget.end),
                guestCount: editTarget.guestCount
            };

            const updated = await updateReservationRequest(editTarget.id, dto);

            setEvents(prev =>
                prev.map(ev => (ev.id === updated.id ? {
                    ...ev,
                    start: new Date(updated.startDate),
                    end: new Date(new Date(updated.endDate).getFullYear(), new Date(updated.endDate).getMonth(), new Date(updated.endDate).getDate(), 23, 59, 59, 999),
                    guestCount: updated.guestCount,
                    resource: { status: updated.status }
                } : ev))
            );

            setEditTarget(null);
            await refreshCalendar(id ?? "");

        } catch (err) {
            console.error("Failed to update reservation:", err);
        }
    };


    async function handleDeleteReservation(id: string) {
        try {
            await deleteReservationRequest(id); // API poziv
            setEvents(prev => prev.filter(ev => ev.id !== id)); // izbaci iz state-a
            setEditTarget(null);
        } catch (err) {
            console.error("Failed to delete:", err);
        } finally {
            setConfirmDelete(false);
        }
    }

    function canCancelReservation(startDate: Date): boolean {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const deadline = new Date(startDate);
        deadline.setDate(deadline.getDate() - 1);
        deadline.setHours(23, 59, 59, 999);

        return today.getTime() <= deadline.getTime();
    }

    return (
        <>
            <GuestNavbar />
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <Paper sx={{ p: 3, width: "100%", maxWidth: "1200px" }}>
                    <Typography variant="h5" gutterBottom textAlign="center">
                        Reservation Calendar
                    </Typography>
                    <div style={{ height: "80vh" }}>
                        <Calendar
                            localizer={localizer}
                            events={events}
                            date={currentDate}
                            onNavigate={(date) => setCurrentDate(date)}
                            startAccessor="start"
                            endAccessor="end"
                            views={{ month: true }}
                            defaultView="month"
                            selectable="ignoreEvents"
                            onSelectSlot={handleSelectSlot}
                            onSelectEvent={handleSelectEvent}
                            style={{ height: "100%" }}

                            dayPropGetter={(date) => {
                                const availability = events.find(
                                    ev => ev.resource.status === "AVAILABLE" &&
                                        date >= ev.start &&
                                        date <= ev.end
                                );

                                if (availability) {
                                    return {
                                        style: {
                                            backgroundColor: "rgba(76, 175, 80, 0.6)",
                                            color: "black",
                                        },
                                    };
                                }
                                return {};
                            }}

                            components={{
                                month: {
                                    dateHeader: ({ date, label }) => {
                                        const availability = events.find(
                                            (ev) =>
                                                ev.resource.status === "AVAILABLE" &&
                                                date >= ev.start &&
                                                date <= ev.end
                                        );

                                        return (
                                            <div style={{ textAlign: "center", fontWeight: "bold" }}>
                                                <div>{label}</div>
                                                {availability && (
                                                    <div>
                                                        AVAILABLE <br />
                                                        {availability.priceType !== "NORMAL"
                                                            ? `⭐ €${availability.price}`
                                                            : `€${availability.price}`}
                                                    </div> as ReactElement
                                                )}
                                            </div> as ReactElement
                                        );
                                    },
                                },
                            }}
                            eventPropGetter={(event) => {
                                switch (event.resource.status) {
                                    case "AVAILABLE":
                                        return { style: { display: "none" } };
                                    case "PENDING":
                                        return {
                                            style: {
                                                backgroundColor: "#ff9800",
                                                color: "white",
                                                borderRadius: "6px",
                                                padding: "2px 6px",
                                            },
                                        };
                                    case "APPROVED":
                                    case "RESERVED":
                                        return {
                                            style: {
                                                backgroundColor: "#2196f3",
                                                color: "white",
                                                borderRadius: "6px",
                                                padding: "2px 6px",
                                            },
                                        };
                                    case "REJECTED":
                                        return {
                                            style: {
                                                backgroundColor: "#f44336",
                                                color: "white",
                                                borderRadius: "6px",
                                                padding: "2px 6px",
                                            },
                                        };
                                    case "CANCELLED":
                                        return {
                                            style: {
                                                backgroundColor: "#9e9e9e",
                                                color: "white",
                                                borderRadius: "6px",
                                                padding: "2px 6px",
                                            },
                                        };
                                    default:
                                        return {};
                                }
                            }}
                        />

                    </div>

                    <Dialog open={open} onClose={() => setOpen(false)}>
                        <DialogTitle>New Reservation</DialogTitle>
                        <DialogContent>
                            <Typography variant="body2" gutterBottom>
                                {range &&
                                    `From ${range.start.toDateString()} to ${range.end.toDateString()}`}
                            </Typography>
                            <TextField
                                label="Guest Count"
                                type="number"
                                value={newGuestCount}
                                onChange={(e) => {
                                    const val = Number(e.target.value);
                                    if (accommodation && val >= accommodation.minGuests && val <= accommodation.maxGuests) {
                                        setNewGuestCount(val);
                                    }
                                }}
                                inputProps={{
                                    min: accommodation ? accommodation.minGuests : 1,
                                    max: accommodation ? accommodation.maxGuests : 99,
                                }}
                                fullWidth
                                sx={{ mt: 2 }}
                            />


                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpen(false)}>Cancel</Button>
                            <Button variant="contained" onClick={handleSaveReservation}>
                                Reserve
                            </Button>
                        </DialogActions>
                    </Dialog>

                    <Dialog open={!!editTarget} onClose={() => setEditTarget(null)}>
                        <DialogTitle>Edit Reservation</DialogTitle>
                        <DialogContent>
                            <Typography variant="body2" gutterBottom>
                                {editTarget &&
                                    `From ${editTarget.start.toDateString()} to ${editTarget.end.toDateString()}`}
                            </Typography>
                            <TextField
                                label="Start Date"
                                type="date"
                                value={editTarget ? formatDate(editTarget.start) : ""}
                                onChange={(e) => {
                                    if (!editTarget) return;
                                    const chosen = new Date(e.target.value);
                                    setEditTarget({
                                        ...editTarget,
                                        start: new Date(
                                            chosen.getFullYear(),
                                            chosen.getMonth(),
                                            chosen.getDate(),
                                            0, 0, 0, 0
                                        ),
                                    });
                                }}
                                fullWidth
                                sx={{ mt: 2 }}
                            />
                            <TextField
                                label="End Date"
                                type="date"
                                value={editTarget ? formatDate(editTarget.end) : ""}
                                onChange={(e) => {
                                    if (!editTarget) return;
                                    const chosen = new Date(e.target.value);
                                    setEditTarget({
                                        ...editTarget,
                                        end: new Date(
                                            chosen.getFullYear(),
                                            chosen.getMonth(),
                                            chosen.getDate(),
                                            23, 59, 59, 999
                                        ),
                                    });
                                }}
                                fullWidth
                                sx={{ mt: 2 }}
                            />
                            {accommodation && editTarget && (
                                <TextField
                                    label="Guest Count"
                                    type="number"
                                    value={editTarget?.guestCount ?? accommodation.minGuests}
                                    onChange={(e) => {
                                        if (!editTarget) return;
                                        const val = Number(e.target.value);
                                        if (val >= accommodation.minGuests && val <= accommodation.maxGuests) {
                                            setEditTarget({
                                                ...editTarget,
                                                guestCount: val,
                                            });
                                        }
                                    }}
                                    inputProps={{
                                        min: accommodation.minGuests,
                                        max: accommodation.maxGuests,
                                    }}
                                    fullWidth
                                    sx={{ mt: 2 }}
                                /> as ReactElement
                            )}
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setEditTarget(null)}>Cancel</Button>
                            <Button
                                color="error"
                                onClick={() => setConfirmDelete(true)}
                            >
                                Delete
                            </Button>
                            <Button variant="contained" onClick={handleUpdateReservation}>
                                Save
                            </Button>
                        </DialogActions>
                    </Dialog>
                    <Dialog open={confirmDelete} onClose={() => setConfirmDelete(false)}>
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogContent>
                            <Typography>
                                Are you sure you want to delete this reservation request?
                            </Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setConfirmDelete(false)}>Cancel</Button>
                            <Button
                                color="error"
                                variant="contained"
                                onClick={async () => {
                                    if (editTarget) {
                                        await handleDeleteReservation(editTarget.id);
                                    }
                                }}
                            >
                                Delete
                            </Button>
                        </DialogActions>
                    </Dialog>
                    <Dialog open={!!cancelTarget} onClose={() => setCancelTarget(null)}>
                        <DialogTitle>Cancel Reservation</DialogTitle>
                        <DialogContent>
                            <Typography>
                                {cancelTarget && (
                                    canCancelReservation(cancelTarget.start) ? (
                                        `Do you really want to cancel your reservation from ${cancelTarget.start.toDateString()} to ${cancelTarget.end.toDateString()}?`
                                    ) : (
                                        "It is too late to cancel this reservation. Cancellation is only possible until the day before it starts."
                                    )
                                )}
                            </Typography>

                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setCancelTarget(null)}>No</Button>
                            <Button
                                color="error"
                                variant="contained"
                                disabled={cancelTarget ? !canCancelReservation(cancelTarget.start) : true}
                                onClick={async () => {
                                    if (cancelTarget && canCancelReservation(cancelTarget.start)) {
                                        try {
                                            await cancelReservation(cancelTarget.id);
                                            await refreshCalendar(id ?? "");
                                            setCancelTarget(null);
                                        } catch (err) {
                                            console.error("Failed to cancel:", err);
                                        }
                                    }
                                }}
                            >
                                Yes, Cancel
                            </Button>
                        </DialogActions>

                    </Dialog>

                </Paper>
            </Box>
        </>
    );
}
