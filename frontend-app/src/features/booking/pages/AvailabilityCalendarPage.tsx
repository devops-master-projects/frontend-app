import { useEffect, useState } from "react";
import {
    Calendar,
    momentLocalizer,
    type SlotInfo
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
import HostNavbar from "../../accommodations/navbar/HostNavbar.tsx";
import {
    createAvailability, deleteAvailability,
    getAvailabilityHost,
    updateAvailability
} from "../api/bookingApi.ts";
import { useParams } from "react-router-dom";
import { Select, MenuItem, FormControl, InputLabel } from "@mui/material";

type MyEvent = {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource: {
        status: "AVAILABLE" | "RESERVED";
    };
    priceType: "NORMAL" | "HOLIDAY" | "SEASONAL" | "WEEKEND";
};

const localizer = momentLocalizer(moment);

export default function AvailabilityCalendarPage() {
    const [events, setEvents] = useState<MyEvent[]>([]);
    const [open, setOpen] = useState(false);
    const [price, setPrice] = useState<number>(0);
    const [range, setRange] = useState<{ start: Date; end: Date } | null>(null);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [editTarget, setEditTarget] = useState<MyEvent | null>(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [priceType, setPriceType] = useState<
        "NORMAL" | "HOLIDAY" | "SEASONAL" | "WEEKEND"
    >("NORMAL");

    const { id } = useParams<{ id: string }>();

    const formatDate = (d: Date) => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
    };

    const rangesOverlap = (aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) =>
        aStart <= bEnd && aEnd >= bStart;

    const normalizeToLocalDay = (d: Date) =>
        new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0);

    const extractPrice = (title: string): number => {
        const match = title.match(/€(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
    };

    useEffect(() => {
        if (!id) return;
        getAvailabilityHost(id).then((data) => {
            const mapped: MyEvent[] = data.map((a) => {
                let title: string;
                if (a.status === "RESERVED") {
                    title = "Reserved";
                } else if (a.priceType !== "NORMAL") {
                    title = `⭐ ${a.priceType} (€${a.price})`;
                } else {
                    title = `Available (€${a.price})`;
                }

                return {
                    id: a.id,
                    title,
                    start: new Date(a.startDate),
                    end: new Date(
                        new Date(a.endDate).getFullYear(),
                        new Date(a.endDate).getMonth(),
                        new Date(a.endDate).getDate(),
                        23, 59, 59, 999
                    ),
                    allDay: true,
                    resource: { status: a.status },
                    priceType: a.priceType,
                };
            });



            mapped.sort((a, b) => a.start.getTime() - b.start.getTime());
            setEvents(mapped);
        });
    }, [id]);

    const handleSelectSlot = (slotInfo: SlotInfo) => {
        const today = normalizeToLocalDay(new Date());
        if (slotInfo.start < today) return;

        if (slotInfo.start && slotInfo.end) {
            const start = normalizeToLocalDay(slotInfo.start);
            // Subtract 1 ms so the end is inclusive of the chosen day
            const rawEnd = normalizeToLocalDay(slotInfo.end);
            const end = new Date(rawEnd.getTime() - 1);

            const newRange = { start, end };

            const overlaps = events.some((e) =>
                rangesOverlap(newRange.start, newRange.end, e.start, e.end)
            );
            if (overlaps) return;

            setRange(newRange);
            setPrice(0);
            setOpen(true);
        }
    };

    const handleSave = async () => {
        if (!range || !id) return;
        try {
            const request = {
                accommodationId: id,
                startDate: formatDate(range.start),
                endDate: formatDate(range.end), // inclusive
                price,
                priceType,
            };

            const created = await createAvailability(request);

            const newEvent: MyEvent = {
                id: created.id,
                title:
                    created.priceType !== "NORMAL"
                        ? `⭐ ${created.priceType} (€${created.price})`
                        : `Available (€${created.price})`,
                start: new Date(created.startDate),
                end: new Date(
                    new Date(created.endDate).getFullYear(),
                    new Date(created.endDate).getMonth(),
                    new Date(created.endDate).getDate(),
                    23, 59, 59, 999
                ),
                allDay: true,
                resource: { status: "AVAILABLE" },
                priceType: created.priceType,
            };
            setEvents(prev => sortEvents([...prev, newEvent]));
            setOpen(false);
        } catch (err) {
            console.error("Failed to create availability:", err);
        }
    };

    const handleSelectEvent = (event: MyEvent) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (event.start < today) return;
        if (event.resource?.status === "RESERVED") return;

        setEditTarget(event);
        setPrice(extractPrice(event.title));
        setPriceType(event.priceType);
    };

    const handleUpdate = async () => {
        if (!editTarget || !id) return;
        try {
            if (editTarget.end.getTime() < editTarget.start.getTime()) return;

            const overlapsReserved = events.some(
                (e) =>
                    e.resource.status === "RESERVED" &&
                    rangesOverlap(editTarget.start, editTarget.end, e.start, e.end)
            );

            if (overlapsReserved) return;
            const overlapsAvailability = events.some((e) => {
                if (e.id === editTarget.id) return false;
                if (e.resource.status !== "AVAILABLE") return false;
                return rangesOverlap(editTarget.start, editTarget.end, e.start, e.end);
            });
            if (overlapsAvailability) return;

            const request = {
                accommodationId: id,
                price,
                startDate: formatDate(editTarget.start),
                endDate: formatDate(editTarget.end), // inclusive
                priceType,
            };

            const updated = await updateAvailability(editTarget.id, request);

            const updatedEvent: MyEvent = {
                ...editTarget,
                title:
                    updated.priceType !== "NORMAL"
                        ? `⭐ ${updated.priceType} (€${updated.price})`
                        : `Available (€${updated.price})`,
                start: new Date(updated.startDate),
                end: new Date(
                    new Date(updated.endDate).getFullYear(),
                    new Date(updated.endDate).getMonth(),
                    new Date(updated.endDate).getDate(),
                    23, 59, 59, 999
                ),
                allDay: true,
                resource: { status: updated.status },
                priceType: updated.priceType,
            };
            const newEvents = sortEvents(
                events.map((e) => (e.id === editTarget.id ? updatedEvent : e))
            );

            // update state
            setEvents(newEvents);
            console.log(newEvents);
            setEditTarget(null);
        } catch (err) {
            console.error("Failed to update availability:", err);
        }
    };
    const sortEvents = (events: MyEvent[]) =>
        [...events].sort((a, b) => a.start.getTime() - b.start.getTime());

    function getNeighborBounds(events: MyEvent[], target: MyEvent) {
        const others = events.filter(ev => ev.id !== target.id);
        const left = others
            .filter(ev => ev.end < target.start)
            .sort((a, b) => b.end.getTime() - a.end.getTime())[0];
        const right = others
            .filter(ev => ev.start > target.start)
            .sort((a, b) => a.start.getTime() - b.start.getTime())[0];
        return { left, right };
    }

    const handleDelete = async () => {
        if (!editTarget) return;
        try {
            await deleteAvailability(editTarget.id);

            setEvents((prev) =>
                sortEvents(prev.filter((e) => e.id !== editTarget.id))
            );
            setEditTarget(null);
        } catch (err) {
            console.error("Delete failed:", err);
        } finally {
            setConfirmDeleteOpen(false);
        }
    };


    return (
        <>
            <HostNavbar />
            <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
                <Paper sx={{ p: 3, width: "100%", maxWidth: "1200px" }}>
                    {/* Modal za edit */}
                    <Dialog open={!!editTarget} onClose={() => setEditTarget(null)}>
                        <DialogTitle>Edit Availability</DialogTitle>
                        <DialogContent>
                            <Typography variant="body2" gutterBottom>
                                {editTarget &&
                                    `From ${editTarget.start.toDateString()} to ${editTarget.end.toDateString()}`}
                            </Typography>

                            <TextField
                                label="Price"
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                fullWidth
                                sx={{ mt: 2 }}
                            />
                            <TextField
                                label="Start Date"
                                type="date"
                                value={editTarget ? formatDate(editTarget.start) : ""}
                                onChange={(e) => {
                                    if (!editTarget) return;
                                    const chosen = new Date(e.target.value);

                                    const conflict = events.some(
                                        (ev) =>
                                            ev.id !== editTarget.id &&
                                            (ev.resource?.status === "AVAILABLE" || ev.resource?.status === "RESERVED") &&
                                            chosen >= ev.start &&
                                            chosen <= ev.end
                                    );
                                    if (conflict) return;

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
                                inputProps={{
                                    ...(editTarget
                                        ? (() => {
                                            const { left } = getNeighborBounds(events, editTarget);
                                            return {
                                                min: left
                                                    ? formatDate(
                                                        new Date(
                                                            left.end.getFullYear(),
                                                            left.end.getMonth(),
                                                            left.end.getDate() + 1
                                                        )
                                                    )
                                                    : undefined,
                                                max: formatDate(editTarget.end),
                                            };
                                        })()
                                        : {}),
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

                                    const conflict = events.some(
                                        (ev) =>
                                            ev.id !== editTarget.id &&
                                            (ev.resource?.status === "AVAILABLE" || ev.resource?.status === "RESERVED") &&
                                            chosen >= ev.start &&
                                            chosen <= ev.end
                                    );
                                    if (conflict) return;

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
                                inputProps={{
                                    ...(editTarget
                                        ? (() => {
                                            const { right } = getNeighborBounds(events, editTarget);
                                            return {
                                                min: formatDate(editTarget.start),
                                                max: right
                                                    ? formatDate(
                                                        new Date(
                                                            right.start.getFullYear(),
                                                            right.start.getMonth(),
                                                            right.start.getDate() - 1
                                                        )
                                                    )
                                                    : undefined,
                                            };
                                        })()
                                        : {}),
                                }}
                                fullWidth
                                sx={{ mt: 2 }}
                            />


                            <FormControl fullWidth sx={{ mt: 2 }}>
                                <InputLabel>Price Type</InputLabel>
                                <Select
                                    value={priceType}
                                    label="Price Type"
                                    onChange={(e) =>
                                        setPriceType(
                                            e.target.value as
                                                | "NORMAL"
                                                | "HOLIDAY"
                                                | "SEASONAL"
                                                | "WEEKEND"
                                        )
                                    }
                                >
                                    <MenuItem value="NORMAL">Normal</MenuItem>
                                    <MenuItem value="HOLIDAY">Holiday</MenuItem>
                                    <MenuItem value="SEASONAL">Seasonal</MenuItem>
                                    <MenuItem value="WEEKEND">Weekend</MenuItem>
                                </Select>
                            </FormControl>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setEditTarget(null)}>Cancel</Button>
                            <Button
                                color="error"
                                onClick={() => setConfirmDeleteOpen(true)}
                            >
                                Delete
                            </Button>
                            <Button variant="contained" onClick={handleUpdate}>
                                Save
                            </Button>
                        </DialogActions>
                    </Dialog>

                    {/* Modal za delete */}
                    <Dialog
                        open={confirmDeleteOpen}
                        onClose={() => setConfirmDeleteOpen(false)}
                    >
                        <DialogTitle>Confirm Delete</DialogTitle>
                        <DialogContent>
                            <Typography>
                                Are you sure you want to delete{" "}
                                <strong>{editTarget?.title}</strong>?
                            </Typography>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setConfirmDeleteOpen(false)}>
                                Cancel
                            </Button>
                            <Button
                                color="error"
                                variant="contained"
                                onClick={handleDelete}
                            >
                                Delete
                            </Button>


                        </DialogActions>
                    </Dialog>

                    <Typography variant="h5" gutterBottom textAlign="center">
                        Availability Calendar
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
                            min={new Date()}
                            style={{ height: "100%" }}
                            dayPropGetter={(date) => {
                                const today = new Date();
                                today.setHours(0, 0, 0, 0);

                                if (date < today) {
                                    return {
                                        style: {
                                            backgroundColor: "#f5f5f5",
                                            color: "#aaa",
                                            pointerEvents: "none",
                                        },
                                    };
                                }
                                return {};
                            }}
                            eventPropGetter={(event) => {
                                let bg = "#4caf50"; // green
                                let cursor = "pointer";
                                let opacity = 1;

                                if (event.resource.status === "RESERVED") {
                                    bg = "#f44336"; // red
                                    cursor = "not-allowed";
                                    opacity = 0.8;
                                }

                                return {
                                    style: {
                                        backgroundColor: bg,
                                        color: "white",
                                        borderRadius: "6px",
                                        padding: "2px 6px",
                                        cursor,
                                        opacity,
                                    },
                                };
                            }}
                        />
                    </div>

                    {/* Modal za unos nove cene */}
                    <Dialog open={open} onClose={() => setOpen(false)}>
                        <DialogTitle>New Availability</DialogTitle>
                        <DialogContent>
                            <Typography variant="body2" gutterBottom>
                                {range &&
                                    `From ${range.start.toDateString()} to ${range.end.toDateString()}`}
                            </Typography>

                            <TextField
                                label="Price"
                                type="number"
                                value={price}
                                onChange={(e) => setPrice(Number(e.target.value))}
                                fullWidth
                                sx={{ mt: 2 }}
                            />
                            <FormControl fullWidth sx={{ mt: 2 }}>
                                <InputLabel>Price Type</InputLabel>
                                <Select
                                    value={priceType}
                                    label="Price Type"
                                    onChange={(e) =>
                                        setPriceType(
                                            e.target.value as
                                                | "NORMAL"
                                                | "HOLIDAY"
                                                | "SEASONAL"
                                                | "WEEKEND"
                                        )
                                    }
                                >
                                    <MenuItem value="NORMAL">Normal</MenuItem>
                                    <MenuItem value="HOLIDAY">Holiday</MenuItem>
                                    <MenuItem value="SEASONAL">Seasonal</MenuItem>
                                    <MenuItem value="WEEKEND">Weekend</MenuItem>
                                </Select>
                            </FormControl>
                        </DialogContent>
                        <DialogActions>
                            <Button onClick={() => setOpen(false)}>Cancel</Button>
                            <Button variant="contained" onClick={handleSave}>
                                Save
                            </Button>
                        </DialogActions>
                    </Dialog>
                </Paper>
            </Box>
        </>
    );
}
