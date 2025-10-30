import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, DollarSign, TrendingUp, ExternalLink, LogOut } from "lucide-react";
import { format, addWeeks, startOfMonth, endOfMonth, isSameDay, parseISO } from "date-fns";
import { toast } from "sonner";

type Payment = {
  date: string;
  amount: number;
  status: "paid" | "due" | "nothing";
};

interface DashboardProps {
  onLogout: () => void;
}

const Dashboard = ({ onLogout }: DashboardProps) => {
  const startDate = new Date(2025, 9, 31); // October 31, 2025
  const paymentAmount = 300;

  // Generate bi-weekly payments for the year
  const generatePayments = (): Payment[] => {
    const payments: Payment[] = [];
    let currentDate = startDate;
    const endDate = new Date(2028, 11, 31); // December 31, 2028
    
    while (currentDate <= endDate) {
      payments.push({
        date: format(currentDate, "yyyy-MM-dd"),
        amount: paymentAmount,
        status: "nothing",
      });
      currentDate = addWeeks(currentDate, 2);
    }
    return payments;
  };

  // Load payments from localStorage or generate new ones
  const loadPayments = (): Payment[] => {
    const stored = localStorage.getItem("payment-statuses");
    if (stored) {
      try {
        const statuses: Record<string, string> = JSON.parse(stored);
        const generated = generatePayments();
        // Merge stored statuses with generated payments
        return generated.map(p => {
          const storedStatus = statuses[p.date];
          return {
            ...p,
            status: (storedStatus === "paid" || storedStatus === "due") ? storedStatus : p.status
          };
        });
      } catch (e) {
        return generatePayments();
      }
    }
    return generatePayments();
  };

  const [payments, setPayments] = useState<Payment[]>(loadPayments());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const setPaymentStatus = (date: string, newStatus: "paid" | "due" | "nothing") => {
    const updatedPayments = payments.map(p => {
      if (p.date === date) {
        return { ...p, status: newStatus };
      }
      return p;
    });
    setPayments(updatedPayments);

    // Save to localStorage
    const statuses: Record<string, "paid" | "due" | "nothing"> = {};
    updatedPayments.forEach(p => {
      statuses[p.date] = p.status;
    });
    localStorage.setItem("payment-statuses", JSON.stringify(statuses));

    toast.success("Payment status updated");
  };

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const monthlyPayments = payments.filter(p => {
    const paymentDate = parseISO(p.date);
    return paymentDate >= monthStart && paymentDate <= monthEnd;
  });

  const monthlyReceived = monthlyPayments
    .filter(p => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const totalPaid = payments
    .filter(p => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const clientLink = `${window.location.origin}/client`;

  const copyClientLink = () => {
    navigator.clipboard.writeText(clientLink);
    toast.success("Client link copied to clipboard!");
  };

  const handleLogout = () => {
    onLogout();
    toast.success("Logged out successfully");
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <CalendarIcon className="h-8 w-8 text-primary" />
              Payment Dashboard
            </h1>
            <p className="text-muted-foreground mt-1">Bi-weekly payment tracking</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={copyClientLink}
              className="flex items-center gap-2"
            >
              <ExternalLink className="h-4 w-4" />
              Copy Client Link
            </Button>
            <Button variant="outline" onClick={handleLogout} className="flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">This Month</p>
                <p className="text-2xl font-bold text-foreground">${monthlyReceived}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-success" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Received</p>
                <p className="text-2xl font-bold text-foreground">${totalPaid}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-primary" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payment Cycle</p>
                <p className="text-2xl font-bold text-foreground">Every 2 Weeks</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-accent/10 flex items-center justify-center">
                <CalendarIcon className="h-6 w-6 text-accent" />
              </div>
            </div>
          </Card>
        </div>

        {/* Calendar */}
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-foreground">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
              >
                Next
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            {monthlyPayments.map((payment) => (
              <div
                key={payment.date}
                className="flex items-center justify-between p-4 rounded-lg border bg-card hover:bg-accent/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">
                      {format(parseISO(payment.date), "dd")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {format(parseISO(payment.date), "MMM")}
                    </p>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {format(parseISO(payment.date), "EEEE, MMMM d, yyyy")}
                    </p>
                    <p className="text-sm text-muted-foreground">${payment.amount}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge
                    variant={payment.status === "paid" ? "default" : payment.status === "due" ? "secondary" : "outline"}
                    className={
                      payment.status === "paid"
                        ? "bg-success text-success-foreground hover:bg-success/90"
                        : payment.status === "due"
                        ? "bg-warning text-warning-foreground hover:bg-warning/90"
                        : "bg-gray-100 text-gray-700"
                    }
                  >
                    {payment.status === "paid" ? "Paid" : payment.status === "due" ? "Due" : "Nothing"}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      variant={payment.status === "paid" ? "default" : "outline"}
                      onClick={() => setPaymentStatus(payment.date, "paid")}
                    >
                      Paid
                    </Button>
                    <Button
                      size="sm"
                      variant={payment.status === "due" ? "secondary" : "outline"}
                      onClick={() => setPaymentStatus(payment.date, "due")}
                    >
                      Due
                    </Button>
                    <Button
                      size="sm"
                      variant={payment.status === "nothing" ? "outline" : "ghost"}
                      onClick={() => setPaymentStatus(payment.date, "nothing")}
                    >
                      Nothing
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
