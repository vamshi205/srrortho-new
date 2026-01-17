import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Activity,
  AlertCircle,
  ArrowLeft,
  ArrowUpDown,
  Calendar,
  CheckCircle2,
  Download,
  Edit,
  Eye,
  FileText,
  Filter,
  IndianRupee,
  LogOut,
  Menu,
  Package,
  Plus,
  RefreshCw,
  Printer,
  Receipt,
  Search,
  Share2,
  Trash2,
  TrendingUp,
  Undo2,
  User,
  Wallet,
  Wrench,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetClose, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { deleteSavedDc, loadSavedDcs, SavedDc, SavedDcHistoryEvent, SavedDcStatus, transitionSavedDc, updateSavedDc } from "@/lib/savedDcStorage";
import html2pdf from "html2pdf.js";

const formatDate = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const formatDateTime = (value: string) => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getDaysPending = (dc: SavedDc) => {
  const start = new Date(dc.savedAt);
  const end = dc.returnedAt ? new Date(dc.returnedAt) : new Date();
  const diff = Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

const getTotalQty = (dc: SavedDc) =>
  dc.items.reduce((total, item) => total + item.sizes.reduce((sum, size) => sum + size.qty, 0), 0);

const SavedDcs = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [savedDcs, setSavedDcs] = useState<SavedDc[]>([]);
  const [filterText, setFilterText] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [quickFilter, setQuickFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"desc" | "asc">("desc");
  const [sortBy, setSortBy] = useState<"date" | "dcNo" | "party" | "items" | "days" | "status">("date");
  const [activeQueue, setActiveQueue] = useState<SavedDcStatus>("pending");
  const [actionDialog, setActionDialog] = useState<{
    type: "return" | "invoice" | "cash" | null;
    dc: SavedDc | null;
  }>({ type: null, dc: null });
  const [returnedByInput, setReturnedByInput] = useState("");
  const [invoiceRefInput, setInvoiceRefInput] = useState("");
  const [returnedRemarksInput, setReturnedRemarksInput] = useState("");
  const [invoiceRemarksInput, setInvoiceRemarksInput] = useState("");
  const [cashRemarksInput, setCashRemarksInput] = useState("");
  const [cashAmountInput, setCashAmountInput] = useState("");
  const [selectedDcId, setSelectedDcId] = useState<string | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; dc: SavedDc | null }>({ open: false, dc: null });
  const [deletePassword, setDeletePassword] = useState("");

  useEffect(() => {
    setSavedDcs(loadSavedDcs());
  }, []);

  const normalizedDcs = useMemo(
    () =>
      savedDcs.map((dc) => ({
        ...dc,
        status: (dc.status ?? "pending") as SavedDcStatus,
        receivedBy: dc.receivedBy ?? "",
        remarks: dc.remarks ?? "",
      })),
    [savedDcs],
  );

  // Apply quick filters
  const applyQuickFilter = (dcs: SavedDc[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(today);
    monthAgo.setMonth(monthAgo.getMonth() - 1);

    switch (quickFilter) {
      case "today":
        return dcs.filter((dc) => new Date(dc.savedAt) >= today);
      case "week":
        return dcs.filter((dc) => new Date(dc.savedAt) >= weekAgo);
      case "month":
        return dcs.filter((dc) => new Date(dc.savedAt) >= monthAgo);
      case "overdue":
        return dcs.filter((dc) => dc.status === "pending" && getDaysPending(dc) > 7);
      default:
        return dcs;
    }
  };

  const statusCounts = useMemo(
    () =>
      normalizedDcs.reduce(
        (acc, dc) => {
          acc[dc.status] += 1;
          return acc;
        },
        { pending: 0, returned: 0, completed: 0, cash: 0 } as Record<SavedDcStatus, number>,
      ),
    [normalizedDcs],
  );

  const selectedDc = useMemo(() => {
    if (!selectedDcId) return null;
    return normalizedDcs.find((dc) => dc.id === selectedDcId) ?? null;
  }, [normalizedDcs, selectedDcId]);

  const getDisplayDate = (dc: SavedDc) =>
    dc.status === "pending" ? dc.savedAt : dc.returnedAt || dc.savedAt;

  const filteredDcs = useMemo(() => {
    const term = filterText.trim().toLowerCase();
    const filtered = normalizedDcs.filter((dc) => dc.status === activeQueue);
    const quickFiltered = applyQuickFilter(filtered);
    const byParty = term
      ? quickFiltered.filter((dc) => 
          dc.hospitalName.toLowerCase().includes(term) || 
          dc.dcNo.toLowerCase().includes(term)
        )
      : quickFiltered;
    const fromDate = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const toDate = dateTo ? new Date(`${dateTo}T23:59:59`) : null;
    const byDate = byParty.filter((dc) => {
      const dateValue = new Date(getDisplayDate(dc)).getTime();
      if (fromDate && dateValue < fromDate.getTime()) return false;
      if (toDate && dateValue > toDate.getTime()) return false;
      return true;
    });
    return [...byDate].sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "date":
          aValue = new Date(getDisplayDate(a)).getTime();
          bValue = new Date(getDisplayDate(b)).getTime();
          break;
        case "dcNo":
          aValue = a.dcNo.toLowerCase();
          bValue = b.dcNo.toLowerCase();
          break;
        case "party":
          aValue = a.hospitalName.toLowerCase();
          bValue = b.hospitalName.toLowerCase();
          break;
        case "items":
          aValue = getTotalQty(a);
          bValue = getTotalQty(b);
          break;
        case "days":
          aValue = getDaysPending(a);
          bValue = getDaysPending(b);
          break;
        case "status":
          aValue = a.status;
          bValue = b.status;
          break;
        default:
          aValue = new Date(getDisplayDate(a)).getTime();
          bValue = new Date(getDisplayDate(b)).getTime();
      }

      if (sortBy === "date" || sortBy === "items" || sortBy === "days") {
        return sortOrder === "desc" ? bValue - aValue : aValue - bValue;
      } else {
        if (sortOrder === "desc") {
          return bValue < aValue ? -1 : bValue > aValue ? 1 : 0;
        } else {
          return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        }
      }
    });
  }, [activeQueue, dateFrom, dateTo, filterText, normalizedDcs, sortBy, sortOrder, quickFilter]);

  // Dashboard metrics
  const dashboardMetrics = useMemo(() => {
    const totalDcs = normalizedDcs.length;
    const pendingDcs = statusCounts.pending;
    const avgTurnaround = normalizedDcs
      .filter((dc) => dc.status !== "pending")
      .reduce((sum, dc) => sum + getDaysPending(dc), 0) / (totalDcs - pendingDcs || 1);
    const totalItemsOut = normalizedDcs
      .filter((dc) => dc.status === "pending" || dc.status === "returned")
      .reduce((sum, dc) => sum + getTotalQty(dc), 0);
    return {
      totalDcs,
      pendingDcs,
      avgTurnaround: Math.round(avgTurnaround),
      totalItemsOut,
    };
  }, [normalizedDcs, statusCounts.pending]);

  const handleDelete = (id: string) => {
    setSavedDcs(deleteSavedDc(id));
    toast({ title: "DC deleted" });
  };

  const requestDelete = (dc: SavedDc) => {
    // Close details modal so we don't see its header behind the confirm dialog
    setDetailsDialogOpen(false);
    if (dc.status === "pending") {
      handleDelete(dc.id);
      setSelectedDcId(null);
      return;
    }
    setDeletePassword("");
    setDeleteDialog({ open: true, dc });
  };

  const confirmProtectedDelete = () => {
    const dc = deleteDialog.dc;
    if (!dc) return;
    if (deletePassword.trim() !== "srrortho") {
      toast({ title: "Incorrect password", variant: "destructive" });
      return;
    }
    handleDelete(dc.id);
    setDeleteDialog({ open: false, dc: null });
    setDeletePassword("");
    setSelectedDcId(null);
  };

  const handleLogout = () => {
    localStorage.removeItem("srrortho:auth");
    navigate("/");
  };

  const handleExportCSV = () => {
    const headers = ["Date", "DC No", "Party", "Status", "Items", "Received By", "Remarks"];
    const rows = filteredDcs.map((dc) => [
      formatDate(getDisplayDate(dc)),
      dc.dcNo,
      dc.hospitalName,
      dc.status.toUpperCase(),
      getTotalQty(dc).toString(),
      dc.receivedBy || "-",
      dc.remarks || "-",
    ]);
    const csv = [headers, ...rows].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `DC-Tracker-${activeQueue}-${formatDate(new Date().toISOString())}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    toast({ title: "Exported to CSV" });
  };

  const createPdfBlob = async (dc: SavedDc) => {
    const rows = dc.items
      .map((item) => {
        const totalQty = item.sizes.reduce((sum, size) => sum + size.qty, 0);
        const sizes = item.sizes
          .filter((size) => size.size)
          .map((size) => `${size.size} (${size.qty})`)
          .join(", ");
        return `<tr><td>${item.name}</td><td>${item.procedure}</td><td>${sizes || "-"}</td><td>${totalQty}</td></tr>`;
      })
      .join("");

    const container = document.createElement("div");
    container.style.padding = "16px";
    container.style.fontFamily = "Arial, sans-serif";
    container.innerHTML = `
      <h1 style="font-size:18px;margin:0 0 6px 0;">DC ${dc.dcNo}</h1>
      <div style="font-size:12px;color:#555;margin-bottom:10px;">
        Party: ${dc.hospitalName} | Date: ${formatDate(dc.savedAt)}
      </div>
      <div style="font-size:12px;color:#555;margin-bottom:10px;">
        Received By: ${dc.receivedBy || "-"} | Remarks: ${dc.remarks || "-"}
      </div>
      <table style="width:100%;border-collapse:collapse;font-size:12px;">
        <thead>
          <tr>
            <th style="border:1px solid #ddd;padding:6px;text-align:left;background:#f5f5f5;">Item</th>
            <th style="border:1px solid #ddd;padding:6px;text-align:left;background:#f5f5f5;">Procedure</th>
            <th style="border:1px solid #ddd;padding:6px;text-align:left;background:#f5f5f5;">Sizes</th>
            <th style="border:1px solid #ddd;padding:6px;text-align:left;background:#f5f5f5;">Qty</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="font-size:12px;color:#555;margin-top:10px;">Instruments: ${dc.instruments.join(", ") || "-"}</div>
      <div style="font-size:12px;color:#555;margin-top:4px;">Box Numbers: ${dc.boxNumbers.join(", ") || "-"}</div>
    `;
    document.body.appendChild(container);
    const opt = {
      margin: 10,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
    };
    const pdf = await html2pdf().set(opt).from(container).outputPdf("blob");
    document.body.removeChild(container);
    return pdf as Blob;
  };

  const handleShare = async (dc: SavedDc) => {
    try {
      const blob = await createPdfBlob(dc);
      const file = new File([blob], `DC-${dc.dcNo}.pdf`, { type: "application/pdf" });
      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: `DC ${dc.dcNo}` });
        return;
      }
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `DC-${dc.dcNo}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: "PDF downloaded" });
    } catch {
      toast({ title: "Unable to share", variant: "destructive" });
    }
  };

  const handlePrint = (dc: SavedDc) => {
    const win = window.open("", "_blank");
    if (!win) {
      toast({ title: "Popup blocked", description: "Allow popups to print." });
      return;
    }
    const rows = dc.items
      .map((item) => {
        const totalQty = item.sizes.reduce((sum, size) => sum + size.qty, 0);
        const sizes = item.sizes
          .filter((size) => size.size)
          .map((size) => `${size.size} (${size.qty})`)
          .join(", ");
        return `<tr><td>${item.name}</td><td>${item.procedure}</td><td>${sizes || "-"}</td><td>${totalQty}</td></tr>`;
      })
      .join("");
    win.document.write(`
      <html>
        <head>
          <title>DC ${dc.dcNo}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 16px; }
            h1 { font-size: 18px; margin-bottom: 4px; }
            .meta { font-size: 12px; color: #555; margin-bottom: 12px; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background: #f5f5f5; }
          </style>
        </head>
        <body>
          <h1>DC ${dc.dcNo}</h1>
          <div class="meta">Party: ${dc.hospitalName} | Date: ${formatDate(dc.savedAt)}</div>
          <div class="meta">Received By: ${dc.receivedBy || "-"} | Remarks: ${dc.remarks || "-"}</div>
          <table>
            <thead>
              <tr><th>Item</th><th>Procedure</th><th>Sizes</th><th>Qty</th></tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <div class="meta">Instruments: ${dc.instruments.join(", ") || "-"}</div>
          <div class="meta">Box Numbers: ${dc.boxNumbers.join(", ") || "-"}</div>
        </body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
  };

  const getStatusBadgeClass = (status: SavedDcStatus) => {
    if (status === "pending") return "bg-destructive/10 text-destructive border-destructive/20";
    if (status === "returned") return "bg-indigo-100 text-indigo-800 border-indigo-200";
    if (status === "cash") return "bg-blue-100 text-blue-800 border-blue-200";
    return "bg-green-100 text-green-800 border-green-200";
  };

  const getStatusIcon = (status: SavedDcStatus) => {
    if (status === "pending") return <AlertCircle className="h-3.5 w-3.5" />;
    if (status === "returned") return <Undo2 className="h-3.5 w-3.5" />;
    if (status === "cash") return <Wallet className="h-3.5 w-3.5" />;
    return <CheckCircle2 className="h-3.5 w-3.5" />;
  };

  const openActionDialog = (type: "return" | "invoice" | "cash", dc: SavedDc) => {
    // Close details modal so we don't see it behind the action dialog
    setDetailsDialogOpen(false);
    setActionDialog({ type, dc });
    setReturnedByInput(dc.returnedBy || "");
    setInvoiceRefInput(dc.invoiceRef || "");
    setReturnedRemarksInput(dc.returnedRemarks || "");
    setInvoiceRemarksInput(dc.invoiceRemarks || "");
    setCashRemarksInput(dc.cashRemarks || "");
  };

  const closeActionDialog = () => {
    setActionDialog({ type: null, dc: null });
    setReturnedByInput("");
    setInvoiceRefInput("");
    setReturnedRemarksInput("");
    setInvoiceRemarksInput("");
    setCashRemarksInput("");
    setCashAmountInput("");
  };

  const handleConfirmReturn = (dc: SavedDc) => {
    const returnedBy = returnedByInput.trim();
    if (!returnedBy) {
      toast({ title: "Returned By is required" });
      return;
    }
    const updated = transitionSavedDc(dc.id, {
      toStatus: "returned",
      action: "MARK_RETURNED",
      updates: {
        returnedBy,
        returnedAt: new Date().toISOString(),
        returnedRemarks: returnedRemarksInput.trim() || "",
      },
    });
    setSavedDcs(updated);
    closeActionDialog();
    toast({ title: "DC marked as returned" });
  };

  const handleConfirmInvoice = (dc: SavedDc) => {
    const invoiceRef = invoiceRefInput.trim();
    if (!invoiceRef) {
      toast({ title: "Invoice number is required" });
      return;
    }
    const updated = transitionSavedDc(dc.id, {
      toStatus: "completed",
      action: dc.status === "cash" ? "MOVE_CASH_TO_COMPLETED" : "LINK_INVOICE",
      // When cash -> completed, clear cash fields (but keep them in history via meta.cleared)
      clear: dc.status === "cash" ? (["cashAt", "cashAmount", "cashRemarks"] as any) : [],
      updates: {
        invoiceRef,
        invoiceRemarks: invoiceRemarksInput.trim() || "",
      },
    });
    setSavedDcs(updated);
    closeActionDialog();
    toast({ title: "Invoice linked. Moved to Completed." });
  };

  const handleConfirmCash = (dc: SavedDc) => {
    const amount = parseFloat(cashAmountInput);
    if (!cashAmountInput.trim() || isNaN(amount) || amount <= 0) {
      toast({ title: "Valid cash amount is required" });
      return;
    }
    const updated = transitionSavedDc(dc.id, {
      toStatus: "cash",
      action: "MOVE_TO_CASH",
      updates: {
        cashAt: new Date().toISOString(),
        cashAmount: amount,
        cashRemarks: cashRemarksInput.trim() || "",
      },
    });
    setSavedDcs(updated);
    closeActionDialog();
    toast({ title: "Moved to Cash queue" });
  };

  const moveBackToReturned = (dc: SavedDc) => {
    const updated = transitionSavedDc(dc.id, {
      toStatus: "returned",
      action: "MOVE_BACK_TO_RETURNED",
      clear: ["invoiceRef", "invoiceRemarks"],
    });
    setSavedDcs(updated);
    toast({ title: "Moved back to Returned" });
  };

  const cancelReturnToPending = (dc: SavedDc) => {
    const updated = transitionSavedDc(dc.id, {
      toStatus: "pending",
      action: "MOVE_BACK_TO_PENDING",
      clear: ["returnedBy", "returnedAt", "returnedRemarks"],
    });
    setSavedDcs(updated);
    toast({ title: "Moved back to Pending" });
  };

  const SortableHeader = ({
    children,
    sortKey,
    className = ""
  }: {
    children: React.ReactNode;
    sortKey: "date" | "dcNo" | "party" | "items" | "days" | "status";
    className?: string;
  }) => (
    <button
      onClick={() => {
        if (sortBy === sortKey) {
          setSortOrder(sortOrder === "desc" ? "asc" : "desc");
        } else {
          setSortBy(sortKey);
          setSortOrder("desc");
        }
      }}
      className={`flex items-center gap-1 hover:bg-slate-200 px-2 py-1 rounded transition-colors ${className}`}
    >
      {children}
      <ArrowUpDown className={`h-3 w-3 ${sortBy === sortKey ? 'text-slate-700' : 'text-slate-400'}`} />
      {sortBy === sortKey && (
        <span className="text-xs font-bold text-slate-700">
          {sortOrder === "desc" ? "↓" : "↑"}
        </span>
      )}
    </button>
  );

  return (
    <div className="min-h-screen bg-gradient-hero overflow-x-hidden">
      <div className="flex min-h-screen">
        {/* Left Menu (desktop) */}
        <aside className="hidden md:flex w-80 border-r border-border bg-card/70 backdrop-blur-md">
          <div className="flex flex-col w-full p-4 gap-4 overflow-y-auto">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                <Activity className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-display font-bold truncate">SRR Ortho Implant</div>
                <div className="text-xs text-muted-foreground">DC Tracker</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">Navigation</div>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/")}>
                <Plus className="w-4 h-4" /> Procedure List
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/")}>
                <Plus className="w-4 h-4" /> Manual DC
              </Button>
              <Button variant="outline" className="w-full justify-start gap-2" disabled>
                <FileText className="w-4 h-4" /> Saved DC List
              </Button>
            </div>

            <div className="mt-auto space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-muted-foreground">Recent Saved</div>
                <Button variant="ghost" size="sm" className="h-7 px-2" onClick={() => setSavedDcs(loadSavedDcs())}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
              <div className="rounded-xl border border-border/70 bg-background/60 p-2 space-y-1">
                {savedDcs.length === 0 ? (
                  <div className="text-xs text-muted-foreground p-2">No saved DCs yet</div>
                ) : (
                  savedDcs
                    .slice()
                    .sort((a, b) => new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime())
                    .slice(0, 6)
                    .map((dc) => (
                      <button
                        key={dc.id}
                        onClick={() => {
                          setSelectedDcId(dc.id);
                          setDetailsDialogOpen(true);
                        }}
                        className="w-full text-left px-2 py-1 rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="text-xs font-medium truncate">{dc.hospitalName}</div>
                        <div className="text-[11px] text-muted-foreground truncate">{dc.dcNo}</div>
                      </button>
                    ))
                )}
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 px-4 sm:px-6 lg:px-8 py-4 sm:py-6 overflow-x-hidden">
          {/* Top toolbar (desktop & mobile) */}
          <div className="sticky top-0 z-20 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 pb-4">
            <div className="rounded-xl border border-border bg-card/80 backdrop-blur-md px-3 py-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <div className="md:hidden w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-primary-foreground">
                  <Activity className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="font-display font-semibold truncate">DC Tracker</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {savedDcs.length} DCs · {statusCounts.pending} pending
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="hidden md:inline-flex border-slate-300 text-slate-700">
                  {activeQueue.toUpperCase()} • {statusCounts[activeQueue]}
                </Badge>
                {/* Mobile menu */}
                <div className="md:hidden">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="icon" className="h-9 w-9">
                        <Menu className="h-4 w-4" />
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="p-4">
                      <SheetHeader className="pr-10">
                        <SheetTitle>DC Tracker</SheetTitle>
                      </SheetHeader>

                      <div className="mt-4 space-y-4">
                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-muted-foreground">Navigation</div>
                          <SheetClose asChild>
                            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/")}>
                              <Plus className="w-4 h-4" /> Procedure List
                            </Button>
                          </SheetClose>
                          <SheetClose asChild>
                            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/")}>
                              <Plus className="w-4 h-4" /> Manual DC
                            </Button>
                          </SheetClose>
                          <Button variant="outline" className="w-full justify-start gap-2" disabled>
                            <FileText className="w-4 h-4" /> Saved DC List
                          </Button>
                        </div>

                        <div className="space-y-2">
                          <div className="text-xs font-semibold text-muted-foreground">Actions</div>
                          <SheetClose asChild>
                            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleExportCSV}>
                              <Download className="w-4 h-4" /> Export CSV
                            </Button>
                          </SheetClose>
                          <SheetClose asChild>
                            <Button variant="outline" className="w-full justify-start gap-2" onClick={() => navigate("/admin")}>
                              <Wrench className="w-4 h-4" /> Admin
                            </Button>
                          </SheetClose>
                          <SheetClose asChild>
                            <Button variant="outline" className="w-full justify-start gap-2" onClick={handleLogout}>
                              <LogOut className="w-4 h-4" /> Logout
                            </Button>
                          </SheetClose>
                        </div>
                      </div>
                    </SheetContent>
                  </Sheet>
                </div>

                {/* Desktop actions */}
                <div className="hidden md:flex items-center gap-2">
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleExportCSV}>
                    <Download className="w-4 h-4" /> Export
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/admin")}>
                    <Wrench className="w-4 h-4" /> Admin
                  </Button>
                  <Button variant="outline" size="sm" className="gap-2" onClick={handleLogout}>
                    <LogOut className="w-4 h-4" /> Logout
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
        {/* Dashboard Metrics */}
        {savedDcs.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="glass-card border-2 border-slate-200 bg-white hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total DCs</p>
                    <p className="text-3xl font-bold text-blue-700">{dashboardMetrics.totalDcs}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-2 border-slate-200 bg-white hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Pending</p>
                    <p className="text-3xl font-bold text-red-600">{dashboardMetrics.pendingDcs}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-200 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-2 border-slate-200 bg-white hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Avg. Turnaround</p>
                    <p className="text-3xl font-bold text-green-700">{dashboardMetrics.avgTurnaround}d</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-green-50 border border-green-200 flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-green-700" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card border-2 border-slate-200 bg-white hover:shadow-lg transition-all duration-200">
            <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Items Out</p>
                    <p className="text-3xl font-bold text-indigo-700">{dashboardMetrics.totalItemsOut}</p>
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-center">
                    <Package className="w-6 h-6 text-indigo-700" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {savedDcs.length === 0 ? (
          <Card className="glass-card border-2 border-border/60">
            <CardHeader>
              <CardTitle>No DCs Tracked Yet</CardTitle>
              <CardDescription>Save a DC from the generator to start tracking.</CardDescription>
            </CardHeader>
          </Card>
        ) : (
          <Card className="glass-card rounded-xl border-2 border-border/60 shadow-md">
            <CardHeader className="p-4 space-y-4">
              {/* Modern Filters */}
              <div className="space-y-6">
                {/* Quick Actions Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-xl bg-gradient-to-r from-muted/30 to-muted/10 border border-border/50">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 min-w-0">
                    <div className="flex items-center gap-2">
                      <Filter className="h-5 w-5 text-primary" />
                      <span className="font-semibold text-sm">Quick Filters</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant={quickFilter === "all" ? "default" : "ghost"}
                        onClick={() => setQuickFilter("all")}
                        className="rounded-full"
                      >
                        All Time
                      </Button>
                      <Button
                        size="sm"
                        variant={quickFilter === "today" ? "default" : "ghost"}
                        onClick={() => setQuickFilter("today")}
                        className="rounded-full"
                      >
                        Today
                      </Button>
                      <Button
                        size="sm"
                        variant={quickFilter === "week" ? "default" : "ghost"}
                        onClick={() => setQuickFilter("week")}
                        className="rounded-full"
                      >
                        This Week
                      </Button>
                      <Button
                        size="sm"
                        variant={quickFilter === "month" ? "default" : "ghost"}
                        onClick={() => setQuickFilter("month")}
                        className="rounded-full"
                      >
                        This Month
                      </Button>
                      {activeQueue === "pending" && (
                        <Button
                          size="sm"
                          variant={quickFilter === "overdue" ? "destructive" : "ghost"}
                          onClick={() => setQuickFilter("overdue")}
                          className="rounded-full"
                        >
                          Overdue (7+ days)
                        </Button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-3" />
                </div>

                {/* Advanced Filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700 flex items-center gap-2">
                      <Search className="h-3.5 w-3.5 text-slate-600" />
                      Search Party/DC
                    </label>
                    <Input
                      value={filterText}
                      onChange={(e) => setFilterText(e.target.value)}
                      placeholder="Enter party name or DC number..."
                      className="h-9 border-slate-300 bg-slate-50 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700 flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-600" />
                      From Date
                    </label>
                    <Input
                      type="date"
                      value={dateFrom}
                      onChange={(e) => setDateFrom(e.target.value)}
                      className="h-9 border-slate-300 bg-slate-50 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-medium text-slate-700 flex items-center gap-2">
                      <Calendar className="h-3.5 w-3.5 text-slate-600" />
                      To Date
                    </label>
                    <Input
                      type="date"
                      value={dateTo}
                      onChange={(e) => setDateTo(e.target.value)}
                      className="h-9 border-slate-300 bg-slate-50 focus:border-blue-500 focus:ring-blue-500"
                    />
                  </div>

                </div>

                {(filterText || dateFrom || dateTo || quickFilter !== "all") && (
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-4 rounded-xl bg-slate-50 border-2 border-slate-200">
                    <span className="text-sm font-medium text-slate-800">Active filters:</span>
                    <div className="flex flex-wrap gap-2">
                      {filterText && (
                        <Badge variant="default" className="gap-1 bg-slate-100 text-slate-800 border-slate-300">
                          <Search className="h-3 w-3" />
                          Search: {filterText}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-red-600"
                            onClick={() => setFilterText("")}
                          />
                        </Badge>
                      )}
                      {dateFrom && (
                        <Badge variant="default" className="gap-1 bg-slate-100 text-slate-800 border-slate-300">
                          <Calendar className="h-3 w-3" />
                          From: {formatDate(dateFrom)}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-red-600"
                            onClick={() => setDateFrom("")}
                          />
                        </Badge>
                      )}
                      {dateTo && (
                        <Badge variant="default" className="gap-1 bg-slate-100 text-slate-800 border-slate-300">
                          <Calendar className="h-3 w-3" />
                          To: {formatDate(dateTo)}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-red-600"
                            onClick={() => setDateTo("")}
                          />
                        </Badge>
                      )}
                      {quickFilter !== "all" && (
                        <Badge variant="default" className="gap-1 bg-slate-100 text-slate-800 border-slate-300">
                          <Filter className="h-3 w-3" />
                          {quickFilter === "today" ? "Today" :
                           quickFilter === "week" ? "This Week" :
                           quickFilter === "month" ? "This Month" :
                           quickFilter === "overdue" ? "Overdue" : quickFilter}
                          <X
                            className="h-3 w-3 cursor-pointer hover:text-red-600"
                            onClick={() => setQuickFilter("all")}
                          />
                        </Badge>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setFilterText("");
                        setDateFrom("");
                        setDateTo("");
                        setQuickFilter("all");
                      }}
                      className="w-full sm:w-auto sm:ml-auto text-xs border-red-300 text-red-700 hover:bg-red-50"
                    >
                      Clear All
                    </Button>
                  </div>
                )}
              </div>

              {/* Queue Tabs */}
              <Tabs value={activeQueue} onValueChange={(value) => setActiveQueue(value as SavedDcStatus)}>
                <TabsList className="grid grid-cols-2 sm:grid-cols-4 gap-1 bg-muted/30 border border-border/50 h-auto sm:h-12 p-1 rounded-xl">
                  <TabsTrigger
                    value="pending"
                    className="gap-2 relative rounded-lg text-xs sm:text-sm py-2 data-[state=active]:bg-destructive data-[state=active]:text-destructive-foreground transition-all"
                  >
                    <AlertCircle className="h-4 w-4" />
                    <span className="font-medium">Pending</span>
                    {statusCounts.pending > 0 && (
                      <Badge
                        variant="destructive"
                        className="ml-1 h-5 min-w-5 flex items-center justify-center text-xs px-1"
                      >
                        {statusCounts.pending > 99 ? '99+' : statusCounts.pending}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="returned"
                    className="gap-2 relative rounded-lg text-xs sm:text-sm py-2 data-[state=active]:bg-indigo-600 data-[state=active]:text-white transition-all"
                  >
                    <User className="h-4 w-4" />
                    <span className="font-medium">Returned</span>
                    {statusCounts.returned > 0 && (
                      <Badge
                        variant="default"
                        className="ml-1 h-5 min-w-5 flex items-center justify-center text-xs px-1"
                      >
                        {statusCounts.returned > 99 ? '99+' : statusCounts.returned}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="completed"
                    className="gap-2 relative rounded-lg text-xs sm:text-sm py-2 data-[state=active]:bg-green-600 data-[state=active]:text-white transition-all"
                  >
                    <Receipt className="h-4 w-4" />
                    <span className="font-medium">Completed</span>
                    {statusCounts.completed > 0 && (
                      <Badge
                        variant="secondary"
                        className="ml-1 h-5 min-w-5 flex items-center justify-center text-xs px-1"
                      >
                        {statusCounts.completed > 99 ? '99+' : statusCounts.completed}
                      </Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="cash"
                    className="gap-2 relative rounded-lg text-xs sm:text-sm py-2 data-[state=active]:bg-blue-600 data-[state=active]:text-white transition-all"
                  >
                    <Wallet className="h-4 w-4" />
                    <span className="font-medium">Cash</span>
                    {statusCounts.cash > 0 && (
                      <Badge
                        variant="outline"
                        className="ml-1 h-5 min-w-5 flex items-center justify-center text-xs px-1"
                      >
                        {statusCounts.cash > 99 ? '99+' : statusCounts.cash}
                      </Badge>
                    )}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </CardHeader>

            <CardContent className="p-0">
              {selectedDc && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 px-4 py-3 border-t-2 border-slate-200 bg-slate-50">
                  <div className="text-sm">
                    <span className="text-slate-600">Selected:</span>{" "}
                    <span className="font-semibold text-blue-700">{selectedDc.dcNo}</span>{" "}
                    <span className="text-slate-500">•</span>{" "}
                    <span className="font-medium text-slate-800">{selectedDc.hospitalName}</span>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 hover:bg-slate-200 self-end sm:self-auto"
                    onClick={() => setSelectedDcId(null)}
                    title="Clear selection"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {/* DC Table */}
              <div className="border-t-2 border-border/60">
                {filteredDcs.length === 0 ? (
                  <div className="p-12 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted/20 flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No DCs found</h3>
                    <p className="text-muted-foreground mb-4">No delivery challans match your current filters.</p>
                    {(filterText || dateFrom || dateTo || quickFilter !== "all") && (
                      <Button
                        variant="outline"
                        onClick={() => {
                          setFilterText("");
                          setDateFrom("");
                          setDateTo("");
                          setQuickFilter("all");
                        }}
                      >
                        Clear all filters
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="border-2 border-slate-300 rounded-lg overflow-hidden">
                    <div className="max-h-[55vh] sm:max-h-[60vh] overflow-y-auto overflow-x-auto md:overflow-x-hidden">
                      <table className="w-full min-w-[980px] md:min-w-0 border-separate border-spacing-0">
                      <thead>
                        <tr className="bg-slate-100 border-b-2 border-slate-300 sticky top-0 z-10">
                          <th className="text-center p-2 sm:p-4 text-sm font-bold text-slate-700 w-[60px] border-r-2 border-slate-300">
                            Select
                          </th>
                          <th className="text-left p-2 sm:p-4 text-sm font-bold text-slate-700 w-[120px] border-r-2 border-slate-300">
                            <SortableHeader sortKey="date">
                              <Calendar className="h-4 w-4 mr-1" />
                              Date
                            </SortableHeader>
                          </th>
                          <th className="text-left p-2 sm:p-4 text-sm font-bold text-slate-700 w-[120px] border-r-2 border-slate-300">
                            <SortableHeader sortKey="dcNo">
                              DC No
                            </SortableHeader>
                          </th>
                          <th className="text-left p-2 sm:p-4 text-sm font-bold text-slate-700 border-r-2 border-slate-300">
                            <SortableHeader sortKey="party">
                              Party Name
                            </SortableHeader>
                          </th>
                          <th className="text-center p-2 sm:p-4 text-sm font-bold text-slate-700 w-[100px] border-r-2 border-slate-300">
                            <SortableHeader sortKey="items">
                              <Package className="h-4 w-4 mr-1" />
                              Items
                            </SortableHeader>
                          </th>
                          <th className="text-center p-2 sm:p-4 text-sm font-bold text-slate-700 w-[100px] border-r-2 border-slate-300">
                            <SortableHeader sortKey="days">
                              Days
                            </SortableHeader>
                          </th>
                          <th className="text-center p-2 sm:p-4 text-sm font-bold text-slate-700 w-[120px] border-r-2 border-slate-300">
                            <SortableHeader sortKey="status">
                              Status
                            </SortableHeader>
                          </th>
                          <th className="text-center p-2 sm:p-4 text-sm font-bold text-slate-700 w-[120px]">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredDcs.map((dc) => {
                          const daysPending = getDaysPending(dc);
                          const totalQty = getTotalQty(dc);
                          return (
                            <tr
                              key={dc.id}
                              className={`border-b-2 transition-all duration-200 ${
                                selectedDcId === dc.id
                                  ? 'bg-gradient-to-r from-blue-100 to-blue-50 border-blue-300 shadow-md ring-1 ring-blue-200'
                                  : 'border-slate-200 hover:bg-slate-50'
                              }`}
                              onClick={() => {
                                setSelectedDcId(dc.id);
                              }}
                            >
                              <td className="p-2 sm:p-4 text-center border-r-2 border-slate-200">
                                <input
                                  type="radio"
                                  name="selected-dc"
                                  className="h-4 w-4 accent-blue-600 cursor-pointer"
                                  checked={selectedDcId === dc.id}
                                  onChange={() => setSelectedDcId(dc.id)}
                                  aria-label={`Select DC ${dc.dcNo}`}
                                  onClick={(e) => e.stopPropagation()}
                                />
                              </td>
                              <td className="p-2 sm:p-4 border-r-2 border-slate-200">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4 text-slate-400 flex-shrink-0" />
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setSelectedDcId(dc.id);
                                      setDetailsDialogOpen(true);
                                    }}
                                    className="text-sm font-medium hover:text-blue-700 transition-colors text-left"
                                  >
                                    {formatDate(getDisplayDate(dc))}
                                  </button>
                                </div>
                              </td>
                              <td className="p-2 sm:p-4 border-r-2 border-slate-200">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDcId(dc.id);
                                    setDetailsDialogOpen(true);
                                  }}
                                  className="text-sm font-semibold text-blue-700 hover:underline transition-colors"
                                >
                                  {dc.dcNo}
                                </button>
                              </td>
                              <td className="p-2 sm:p-4 border-r-2 border-slate-200">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedDcId(dc.id);
                                    setDetailsDialogOpen(true);
                                  }}
                                  className="text-sm hover:text-blue-700 transition-colors text-left max-w-[160px] sm:max-w-48 truncate"
                                >
                                  {dc.hospitalName}
                                </button>
                              </td>
                              <td className="p-2 sm:p-4 text-center border-r-2 border-slate-200">
                                <div className="flex items-center justify-center gap-1">
                                  <Package className="h-3.5 w-3.5 text-slate-400" />
                                  <Badge variant="outline" className="text-xs font-medium border-slate-300">
                                    {totalQty}
                                  </Badge>
                                </div>
                              </td>
                              <td className="p-2 sm:p-4 text-center border-r-2 border-slate-200">
                                <div className={`text-sm font-medium ${daysPending > 7 && dc.status === 'pending' ? 'text-red-600' : 'text-slate-600'}`}>
                                  {daysPending}d
                                  {daysPending > 7 && dc.status === 'pending' && (
                                    <AlertCircle className="h-3 w-3 inline ml-1" />
                                  )}
                                </div>
                              </td>
                              <td className="p-2 sm:p-4 border-r-2 border-slate-200">
                                <div className="flex justify-center">
                                  <Badge className={`${getStatusBadgeClass(dc.status)} flex items-center gap-1.5 text-xs font-medium border px-2 py-1`}>
                                    {getStatusIcon(dc.status)}
                                    {dc.status.charAt(0).toUpperCase() + dc.status.slice(1)}
                                  </Badge>
                                </div>
                              </td>
                              <td className="p-2 sm:p-4 text-center">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-8 w-8 p-0 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                      disabled={!selectedDcId || selectedDcId !== dc.id}
                                      title="Actions"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <Edit className="h-4 w-4 text-slate-600" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="w-48">
                                    <DropdownMenuItem
                      onClick={() => {
                        setSelectedDcId(dc.id);
                        setDetailsDialogOpen(true);
                      }}
                                      className="gap-2"
                                    >
                                      <Eye className="h-4 w-4" />
                                      View Details
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handlePrint(dc)}
                                      className="gap-2"
                                    >
                                      <Printer className="h-4 w-4" />
                                      Print DC
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => handleShare(dc)}
                                      className="gap-2"
                                    >
                                      <Share2 className="h-4 w-4" />
                                      Share PDF
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={() => openActionDialog("return", dc)}
                                      disabled={dc.status !== "pending"}
                                      className="gap-2"
                                    >
                                      <User className="h-4 w-4" />
                                      Mark as Returned
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => openActionDialog("invoice", dc)}
                                      disabled={dc.status !== "returned"}
                                      className="gap-2"
                                    >
                                      <Receipt className="h-4 w-4" />
                                      Link Invoice
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={() => openActionDialog("cash", dc)}
                                      disabled={dc.status !== "returned"}
                                      className="gap-2"
                                    >
                                      <Wallet className="h-4 w-4" />
                                      Move to Cash
                                    </DropdownMenuItem>
                                    {dc.status === "completed" && (
                                      <DropdownMenuItem onClick={() => moveBackToReturned(dc)} className="gap-2">
                                        <Undo2 className="h-4 w-4" />
                                        Move back to Returned
                                      </DropdownMenuItem>
                                    )}
                                    {dc.status === "returned" && (
                                      <DropdownMenuItem onClick={() => cancelReturnToPending(dc)} className="gap-2">
                                        <Undo2 className="h-4 w-4" />
                                        Cancel Return (Back to Pending)
                                      </DropdownMenuItem>
                                    )}
                                    {dc.status === "cash" && (
                                      <DropdownMenuItem
                                        onClick={() => openActionDialog("invoice", dc)}
                                        className="gap-2"
                                      >
                                        <Receipt className="h-4 w-4" />
                                        Link Invoice (Move to Completed)
                                      </DropdownMenuItem>
                                    )}
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => requestDelete(dc)} className="text-destructive gap-2">
                                      <X className="h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                    </div>
                  </div>
                )}
              </div>

            </CardContent>
          </Card>
        )}
          </div>
        </main>
      </div>

      {/* Action Dialogs */}
      <Dialog
        open={actionDialog.type !== null && actionDialog.dc !== null}
        onOpenChange={(open) => {
          if (!open) closeActionDialog();
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog.type === "return" && "Mark as Returned"}
              {actionDialog.type === "invoice" && "Link Invoice"}
              {actionDialog.type === "cash" && "Move to Cash Queue"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              Update the selected delivery challan status and related fields.
            </DialogDescription>
          </DialogHeader>
          {actionDialog.type === "return" && actionDialog.dc && (
            <div className="space-y-4 pt-2">
              <div>
                <Label>Returned By *</Label>
                <Input
                  value={returnedByInput}
                  onChange={(e) => setReturnedByInput(e.target.value)}
                  placeholder="Enter name"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Return Remarks</Label>
                <Textarea
                  value={returnedRemarksInput}
                  onChange={(e) => setReturnedRemarksInput(e.target.value)}
                  placeholder="Add return remarks"
                  className="mt-1 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleConfirmReturn(actionDialog.dc!)}>Confirm Return</Button>
                <Button variant="outline" onClick={closeActionDialog}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {actionDialog.type === "invoice" && actionDialog.dc && (
            <div className="space-y-4 pt-2">
              <div>
                <Label>Invoice No *</Label>
                <Input
                  value={invoiceRefInput}
                  onChange={(e) => setInvoiceRefInput(e.target.value)}
                  placeholder="Enter invoice number"
                  className="mt-1"
                />
              </div>
              <div>
                <Label>Invoice Remarks</Label>
                <Textarea
                  value={invoiceRemarksInput}
                  onChange={(e) => setInvoiceRemarksInput(e.target.value)}
                  placeholder="Add invoice remarks"
                  className="mt-1 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleConfirmInvoice(actionDialog.dc!)}>Link Invoice</Button>
                <Button variant="outline" onClick={closeActionDialog}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
          {actionDialog.type === "cash" && actionDialog.dc && (
            <div className="space-y-4 pt-2">
              <p className="text-sm text-muted-foreground">
                This will move the DC to the Cash queue.
              </p>
              <div>
                <Label className="flex items-center gap-2">
                  <IndianRupee className="h-4 w-4 text-blue-700" />
                  Cash Amount *
                </Label>
                <div className="mt-1 flex items-center rounded-md border border-slate-300 bg-slate-50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/30">
                  <span className="px-3 text-sm font-medium text-slate-600">₹</span>
                  <Input
                    type="number"
                    value={cashAmountInput}
                    onChange={(e) => setCashAmountInput(e.target.value)}
                    placeholder="0.00"
                    className="h-9 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    min="0"
                    step="0.01"
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">Required to move the DC to Cash queue.</p>
              </div>
              <div>
                <Label>Cash Remarks</Label>
                <Textarea
                  value={cashRemarksInput}
                  onChange={(e) => setCashRemarksInput(e.target.value)}
                  placeholder="Add cash remarks"
                  className="mt-1 resize-none"
                  rows={3}
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={() => handleConfirmCash(actionDialog.dc!)}>Move to Cash</Button>
                <Button variant="outline" onClick={closeActionDialog}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[85vh] overflow-y-auto p-4 sm:p-5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-700" />
              {selectedDc ? `DC ${selectedDc.dcNo}` : "DC Details"}
            </DialogTitle>
            <DialogDescription className="sr-only">
              View delivery challan details, items, instruments, notes, and history.
            </DialogDescription>
          </DialogHeader>

          {!selectedDc ? (
            <div className="text-sm text-slate-600">Select a DC to view details.</div>
          ) : (
            <div className="space-y-3">
              {/* Header strip */}
              <div className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-slate-200 bg-white px-3 py-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <Badge className={`${getStatusBadgeClass(selectedDc.status)} flex items-center gap-1.5 text-xs font-medium border px-2 py-1`}>
                      {getStatusIcon(selectedDc.status)}
                      {selectedDc.status.toUpperCase()}
                    </Badge>
                    <div className="text-sm font-semibold text-slate-900 truncate">{selectedDc.hospitalName}</div>
                  </div>
                  <div className="mt-1 text-xs text-slate-600">
                    Date: <span className="font-medium text-slate-800">{formatDate(getDisplayDate(selectedDc))}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    Items: <span className="font-medium text-slate-800">{getTotalQty(selectedDc)}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    Received: <span className="font-medium text-slate-800">{selectedDc.receivedBy || "-"}</span>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                    onClick={() => handlePrint(selectedDc)}
                    title="Print"
                  >
                    <Printer className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-slate-700 hover:text-slate-900 hover:bg-slate-100"
                    onClick={() => handleShare(selectedDc)}
                    title="Share PDF"
                  >
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => requestDelete(selectedDc)}
                    title="Delete"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="overview">
                <TabsList className="w-full justify-start bg-slate-50 border border-slate-200">
                  <TabsTrigger value="overview" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Overview
                  </TabsTrigger>
                  <TabsTrigger value="items" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Items & Instruments
                  </TabsTrigger>
                  <TabsTrigger value="notes" className="data-[state=active]:bg-blue-600 data-[state=active]:text-white">
                    Notes
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="mt-3 space-y-3">
                  {/* Tracking + actions (courier-tracking style) */}
                  <div className="rounded-md border border-slate-200 bg-white p-3">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-slate-700">Tracking</div>
                        <div className="mt-2 flex items-center gap-2 text-xs text-slate-600">
                          {(() => {
                            const step1Done = true;
                            const step2Done = selectedDc.status !== "pending";
                            const step3Done = selectedDc.status === "completed" || selectedDc.status === "cash";
                            const step3Label = selectedDc.status === "cash" ? "Cash" : "Completed";
                            const dot = (done: boolean, active: boolean) =>
                              done
                                ? "bg-blue-600 border-blue-600"
                                : active
                                  ? "bg-white border-blue-600"
                                  : "bg-white border-slate-300";
                            const line = (done: boolean) => (done ? "bg-blue-600" : "bg-slate-200");
                            return (
                              <div className="flex items-center gap-2 w-full">
                                <div className="flex items-center gap-2">
                                  <span className={`h-2.5 w-2.5 rounded-full border ${dot(step1Done, selectedDc.status === "pending")}`} />
                                  <span className="font-medium text-slate-800">Created</span>
                                </div>
                                <div className={`h-0.5 flex-1 rounded ${line(step2Done)}`} />
                                <div className="flex items-center gap-2">
                                  <span className={`h-2.5 w-2.5 rounded-full border ${dot(step2Done, selectedDc.status === "returned")}`} />
                                  <span className="font-medium text-slate-800">Returned</span>
                                </div>
                                <div className={`h-0.5 flex-1 rounded ${line(step3Done)}`} />
                                <div className="flex items-center gap-2">
                                  <span className={`h-2.5 w-2.5 rounded-full border ${dot(step3Done, selectedDc.status === "completed" || selectedDc.status === "cash")}`} />
                                  <span className="font-medium text-slate-800">{step3Label}</span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                        <div className="mt-2 text-xs text-slate-600">
                          Created: <span className="font-medium text-slate-800">{formatDateTime(selectedDc.savedAt)}</span>
                          <span className="mx-2 text-slate-300">|</span>
                          Returned: <span className="font-medium text-slate-800">{selectedDc.returnedAt ? formatDateTime(selectedDc.returnedAt) : "-"}</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50 hover:text-indigo-800"
                          disabled={selectedDc.status !== "pending"}
                          onClick={() => openActionDialog("return", selectedDc)}
                        >
                          <User className="h-4 w-4" /> Return
                        </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-2 border-green-300 text-green-700 hover:bg-green-50 hover:text-green-800"
                      disabled={selectedDc.status !== "returned" && selectedDc.status !== "cash"}
                      onClick={() => openActionDialog("invoice", selectedDc)}
                    >
                          <Receipt className="h-4 w-4" /> Link Invoice
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                          disabled={selectedDc.status !== "returned"}
                          onClick={() => openActionDialog("cash", selectedDc)}
                        >
                          <Wallet className="h-4 w-4" /> Cash
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-700 mb-2">Timeline</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500">Created</span>
                          <span className="font-medium text-slate-800">{formatDateTime(selectedDc.savedAt)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500">Returned</span>
                          <span className="font-medium text-slate-800">{selectedDc.returnedAt ? formatDateTime(selectedDc.returnedAt) : "-"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500">Cash At</span>
                          <span className="font-medium text-slate-800">{(selectedDc as any).cashAt ? formatDateTime((selectedDc as any).cashAt) : "-"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-700 mb-2 flex items-center gap-2">
                        <Receipt className="h-4 w-4 text-slate-600" />
                        Invoice / Cash
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500">Invoice No</span>
                          <span className="font-medium text-slate-800">{selectedDc.invoiceRef || "-"}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="text-slate-500">Cash Amount</span>
                          <span className="font-semibold text-green-700">
                            {typeof (selectedDc as any).cashAmount === "number"
                              ? `₹${(selectedDc as any).cashAmount.toFixed(2)}`
                              : "-"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="items" className="mt-3">
                  <div className="space-y-3">
                    <div className="rounded-md border border-slate-200 bg-white overflow-hidden">
                      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-200 bg-slate-50">
                        <div className="text-xs font-semibold text-slate-700">Items</div>
                        <Badge variant="outline" className="border-slate-300 text-slate-700">{getTotalQty(selectedDc)} qty</Badge>
                      </div>
                      <div className="max-h-[35vh] overflow-auto">
                        <table className="w-full text-sm border-separate border-spacing-0">
                          <thead className="sticky top-0 z-10">
                            <tr className="bg-slate-100 border-b border-slate-200">
                              <th className="text-left px-3 py-2 text-xs font-semibold text-slate-700 border-b border-slate-200">Item</th>
                              <th className="text-left px-3 py-2 text-xs font-semibold text-slate-700 border-b border-slate-200">Procedure</th>
                              <th className="text-left px-3 py-2 text-xs font-semibold text-slate-700 border-b border-slate-200">Sizes</th>
                              <th className="text-right px-3 py-2 text-xs font-semibold text-slate-700 border-b border-slate-200">Qty</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedDc.items.map((item, idx) => {
                              const itemQty = item.sizes.reduce((sum, size) => sum + size.qty, 0);
                              const sizeDetails = item.sizes
                                .filter((size) => size.size)
                                .map((size) => `${size.size} (${size.qty})`)
                                .join(", ");
                              return (
                                <tr key={idx} className="border-b border-slate-200">
                                  <td className="px-3 py-2 font-medium text-slate-900">{item.name}</td>
                                  <td className="px-3 py-2 text-slate-600">{item.procedure}</td>
                                  <td className="px-3 py-2 text-slate-600">{sizeDetails || "-"}</td>
                                  <td className="px-3 py-2 text-right font-semibold text-slate-900">{itemQty}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="rounded-md border border-slate-200 bg-white p-3">
                        <div className="text-xs font-semibold text-slate-700 mb-2">Instruments</div>
                        <div className="text-sm bg-slate-50 border border-slate-200 rounded px-2 py-2 min-h-[60px]">
                          {selectedDc.instruments?.length ? selectedDc.instruments.join(", ") : "-"}
                        </div>
                      </div>
                      <div className="rounded-md border border-slate-200 bg-white p-3">
                        <div className="text-xs font-semibold text-slate-700 mb-2">Box Numbers</div>
                        <div className="text-sm bg-slate-50 border border-slate-200 rounded px-2 py-2 min-h-[60px]">
                          {selectedDc.boxNumbers?.length ? selectedDc.boxNumbers.join(", ") : "-"}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="notes" className="mt-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-700 mb-2">Initial Remarks</div>
                      <div className="text-sm bg-slate-50 border border-slate-200 rounded px-2 py-2 min-h-[72px]">
                        {selectedDc.remarks || "-"}
                      </div>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-700 mb-2">Return Remarks</div>
                      <div className="text-sm bg-slate-50 border border-slate-200 rounded px-2 py-2 min-h-[72px]">
                        {selectedDc.returnedRemarks || "-"}
                      </div>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-700 mb-2">Invoice Remarks</div>
                      <div className="text-sm bg-slate-50 border border-slate-200 rounded px-2 py-2 min-h-[72px]">
                        {selectedDc.invoiceRemarks || "-"}
                      </div>
                    </div>
                    <div className="rounded-md border border-slate-200 bg-white p-3">
                      <div className="text-xs font-semibold text-slate-700 mb-2">Cash Remarks</div>
                      <div className="text-sm bg-slate-50 border border-slate-200 rounded px-2 py-2 min-h-[72px]">
                        {selectedDc.cashRemarks || "-"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 rounded-md border border-slate-200 bg-white p-3">
                    <div className="text-xs font-semibold text-slate-700 mb-2">History</div>
                    {selectedDc.history?.length ? (
                      <div className="space-y-2">
                        {[...selectedDc.history]
                          .slice(-12)
                          .reverse()
                          .map((h: SavedDcHistoryEvent, idx: number) => (
                            <div key={`${h.at}-${idx}`} className="flex items-start justify-between gap-3 text-xs">
                              <div className="min-w-0">
                                <div className="font-medium text-slate-900">
                                  {h.action.replaceAll("_", " ")}
                                </div>
                                <div className="text-slate-600">
                                  {h.fromStatus ? `${h.fromStatus.toUpperCase()} → ` : ""}
                                  {h.toStatus.toUpperCase()}
                                </div>
                              </div>
                              <div className="text-slate-500 whitespace-nowrap">{formatDateTime(h.at)}</div>
                            </div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-xs text-slate-600">No history yet.</div>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Protected Delete Dialog */}
      <Dialog
        open={deleteDialog.open}
        onOpenChange={(open) => setDeleteDialog({ open, dc: open ? deleteDialog.dc : null })}
      >
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
            <DialogDescription className="sr-only">
              Enter password to delete non-pending delivery challans.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Deleting a <span className="font-medium">{deleteDialog.dc?.status?.toUpperCase()}</span> DC requires a password.
            </p>
            <div>
              <Label>Password</Label>
              <Input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter password"
                className="mt-1"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setDeleteDialog({ open: false, dc: null })}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={confirmProtectedDelete}>
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SavedDcs;
