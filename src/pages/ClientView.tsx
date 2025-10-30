import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CalendarIcon, DollarSign, AlertCircle } from "lucide-react";
import { format, addWeeks, startOfMonth, endOfMonth, parseISO } from "date-fns";

type Payment = {
  date: string;
  amount: number;
  status: "paid" | "due";
};

const ClientView = () => {
  const startDate = new Date(2025, 9, 31); // Oct 31, 2025
  const paymentAmount = 300;
  
  const generatePayments = (): Payment[] => {
    const payments: Payment[] = [];
    let currentDate = startDate;
    const endDate = new Date(2028, 11, 31); // Dec 31, 2028
    
    while (currentDate <= endDate) {
      payments.push({
        date: format(currentDate, "yyyy-MM-dd"),
        amount: paymentAmount,
        status: currentDate < new Date() ? "paid" : "due",
      });
      currentDate = addWeeks(currentDate, 2);
    }
    return payments;
  };

  // Load payments from localStorage
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

  // Reload payments when localStorage changes or page becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setPayments(loadPayments());
      }
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "payment-statuses") {
        setPayments(loadPayments());
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("storage", handleStorageChange);
    
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  
  const monthlyPayments = payments.filter(p => {
    const paymentDate = parseISO(p.date);
    return paymentDate >= monthStart && paymentDate <= monthEnd;
  });
  
  const overduePayments = payments
    .filter(p => p.status === "due" && parseISO(p.date) <= new Date());
    
  const totalDue = overduePayments.reduce((sum, p) => sum + p.amount, 0);
  
  const totalPaid = payments
    .filter(p => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
    
  const nextPayment = payments.find(p => p.status === "due" && parseISO(p.date) > new Date());

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground flex items-center justify-center gap-2">
            <CalendarIcon className="h-8 w-8 text-primary" />
            Payment Status
          </h1>
          <p className="text-muted-foreground mt-2">View your payment schedule and status</p>
        </div>

        {/* Due Payment Alert */}
        {totalDue > 0 && (
          <div className="space-y-3">
            {overduePayments.map((payment) => (
              <Alert 
                key={payment.date}
                variant="destructive" 
                className="border-2 border-destructive bg-destructive/10"
              >
                <AlertCircle className="h-5 w-5" />
                <AlertTitle className="text-lg font-bold">Payment Due - ${payment.amount}</AlertTitle>
                <AlertDescription className="text-base font-medium">
                  Please make payment for {format(parseISO(payment.date), "MMMM d, yyyy")}
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Payment Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-6 bg-success/10 border-success">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Total Paid</p>
              <p className="text-4xl font-bold text-success">${totalPaid}</p>
              <p className="text-xs text-muted-foreground mt-1">Payment Received</p>
            </div>
          </Card>
          
          <Card className={`p-6 ${totalDue > 0 ? "bg-destructive/10 border-destructive" : "bg-muted"}`}>
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Total Due</p>
              <p className={`text-4xl font-bold ${totalDue > 0 ? "text-destructive" : "text-foreground"}`}>
                ${totalDue}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {totalDue > 0 ? "Payment Required" : "All Cleared"}
              </p>
            </div>
          </Card>
          
          <Card className="p-6 bg-primary/10 border-primary">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">Next Payment</p>
              {nextPayment ? (
                <>
                  <p className="text-2xl font-bold text-primary">
                    {format(parseISO(nextPayment.date), "MMM dd")}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">${nextPayment.amount}</p>
                </>
              ) : (
                <p className="text-xl font-bold text-muted-foreground">None</p>
              )}
            </div>
          </Card>
        </div>

        {/* Month Navigation */}
        <Card className="p-4">
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
            >
              Previous
            </Button>
            <h2 className="text-xl font-bold text-foreground">
              {format(currentMonth, "MMMM yyyy")}
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
            >
              Next
            </Button>
          </div>
        </Card>

        {/* Payment Schedule */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-foreground mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            Payment Schedule
          </h2>
          
          {monthlyPayments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No payments scheduled for this month</p>
          ) : (
            <div className="space-y-3">
              {monthlyPayments.map((payment) => {
                const isOverdue = payment.status === "due" && parseISO(payment.date) <= new Date();
                return (
                  <div
                    key={payment.date}
                    className={`flex items-center justify-between p-4 rounded-lg border ${
                      isOverdue ? "border-destructive bg-destructive/5" : "bg-card"
                    }`}
                  >
                  <div className="flex items-center gap-4">
                    <div className="text-center min-w-[60px]">
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
                  <Badge
                    variant={payment.status === "paid" ? "default" : "secondary"}
                    className={
                      payment.status === "paid"
                        ? "bg-success text-success-foreground"
                        : isOverdue 
                        ? "bg-destructive text-destructive-foreground"
                        : "bg-warning text-warning-foreground"
                    }
                  >
                    {payment.status === "paid" ? "Paid" : isOverdue ? "Overdue" : "Due"}
                  </Badge>
                </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Footer Info */}
        <Card className="p-6 bg-muted/50">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">Payment Cycle: Every 2 weeks</p>
            <p className="text-sm text-muted-foreground">Payment Amount: $300</p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default ClientView;
