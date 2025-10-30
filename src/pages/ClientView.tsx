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
    const endDate = new Date(2025, 11, 31);
    
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

  const monthlyReceived = monthlyPayments
    .filter(p => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);

  const overduePayments = payments
    .filter(p => p.status === "due" && parseISO(p.date) <= new Date());
    
  const totalDue = overduePayments.reduce((sum, p) => sum + p.amount, 0);

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

        {/* Monthly Summary */}
        <Card className="p-6">
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Current Month</p>
              <p className="text-3xl font-bold text-foreground">{format(currentMonth, "MMMM yyyy")}</p>
            </div>
            <div className="h-16 w-px bg-border" />
            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-1">Received This Month</p>
              <p className="text-3xl font-bold text-success">${monthlyReceived}</p>
            </div>
          </div>
        </Card>

        {/* Navigation */}
        <div className="flex justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
          >
            Previous Month
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentMonth(new Date())}
          >
            Current Month
          </Button>
          <Button
            variant="outline"
            onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
          >
            Next Month
          </Button>
        </div>

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
