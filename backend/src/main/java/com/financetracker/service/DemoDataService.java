package com.financetracker.service;

import com.financetracker.model.*;
import com.financetracker.repository.BudgetRepository;
import com.financetracker.repository.CategoryRepository;
import com.financetracker.repository.TransactionRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;

@Service
public class DemoDataService implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final TransactionRepository transactionRepository;
    private final BudgetRepository budgetRepository;

    public DemoDataService(CategoryRepository categoryRepository,
                           TransactionRepository transactionRepository,
                           BudgetRepository budgetRepository) {
        this.categoryRepository = categoryRepository;
        this.transactionRepository = transactionRepository;
        this.budgetRepository = budgetRepository;
    }

    @Override
    public void run(String... args) {
        initDefaultCategories();
    }

    @Transactional
    public void initDefaultCategories() {
        if (categoryRepository.findByUserIsNullOrderByNameAsc().isEmpty()) {
            List<Category> defaultCategories = Arrays.asList(
                    // Expense categories
                    new Category("Food", TransactionType.EXPENSE, "Utensils", "#EF4444", false, null),
                    new Category("Shopping", TransactionType.EXPENSE, "ShoppingBag", "#F59E0B", false, null),
                    new Category("Transportation", TransactionType.EXPENSE, "Car", "#3B82F6", false, null),
                    new Category("Education", TransactionType.EXPENSE, "GraduationCap", "#8B5CF6", false, null),
                    new Category("Healthcare", TransactionType.EXPENSE, "Activity", "#EC4899", false, null),
                    new Category("Entertainment", TransactionType.EXPENSE, "Film", "#06B6D4", false, null),
                    new Category("Rent", TransactionType.EXPENSE, "Home", "#10B981", false, null),
                    new Category("Bills", TransactionType.EXPENSE, "FileText", "#6366F1", false, null),
                    new Category("Other", TransactionType.EXPENSE, "MoreHorizontal", "#64748B", false, null),

                    // Income categories
                    new Category("Salary", TransactionType.INCOME, "Briefcase", "#10B981", false, null),
                    new Category("Freelance", TransactionType.INCOME, "Laptop", "#06B6D4", false, null),
                    new Category("Investments", TransactionType.INCOME, "TrendingUp", "#3B82F6", false, null),
                    new Category("Business", TransactionType.INCOME, "Building2", "#8B5CF6", false, null),
                    new Category("Gifts", TransactionType.INCOME, "Gift", "#EC4899", false, null),
                    new Category("Other Income", TransactionType.INCOME, "DollarSign", "#F59E0B", false, null)
            );
            categoryRepository.saveAll(defaultCategories);
        }
    }

    @Transactional
    public void seedDemoDataForUser(User user) {
        LocalDate today = LocalDate.now();
        int currentMonth = today.getMonthValue();
        int currentYear = today.getYear();

        // 1. Budgets for Current Month
        budgetRepository.save(new Budget(user, "Food", new BigDecimal("600.00"), currentMonth, currentYear, 80));
        budgetRepository.save(new Budget(user, "Shopping", new BigDecimal("400.00"), currentMonth, currentYear, 80));
        budgetRepository.save(new Budget(user, "Transportation", new BigDecimal("250.00"), currentMonth, currentYear, 85));
        budgetRepository.save(new Budget(user, "Rent", new BigDecimal("1200.00"), currentMonth, currentYear, 90));
        budgetRepository.save(new Budget(user, "Bills", new BigDecimal("350.00"), currentMonth, currentYear, 80));
        budgetRepository.save(new Budget(user, "Entertainment", new BigDecimal("200.00"), currentMonth, currentYear, 75));

        // 2. Realistic Transactions across past 3 months
        // Current Month Income
        transactionRepository.save(new Transaction(user, TransactionType.INCOME, new BigDecimal("4800.00"), "Salary", today.withDayOfMonth(1), "Monthly Tech Salary", "Direct direct deposit", "Bank Transfer"));
        transactionRepository.save(new Transaction(user, TransactionType.INCOME, new BigDecimal("750.00"), "Freelance", today.minusDays(5), "Frontend UI Design Project", "Client in Australia", "Bank Transfer"));
        transactionRepository.save(new Transaction(user, TransactionType.INCOME, new BigDecimal("180.00"), "Investments", today.minusDays(12), "Quarterly S&P 500 Dividend", "Reinvested dividend", "Other"));

        // Current Month Expenses
        transactionRepository.save(new Transaction(user, TransactionType.EXPENSE, new BigDecimal("1200.00"), "Rent", today.withDayOfMonth(2), "Apartment Monthly Rent", "Apartment 4B downtown", "Bank Transfer"));
        transactionRepository.save(new Transaction(user, TransactionType.EXPENSE, new BigDecimal("135.50"), "Food", today.minusDays(1), "Whole Foods Grocery", "Weekly organic groceries", "Card"));
        transactionRepository.save(new Transaction(user, TransactionType.EXPENSE, new BigDecimal("45.20"), "Food", today.minusDays(3), "Dinner with Friends", "Italian bistro", "Card"));
        transactionRepository.save(new Transaction(user, TransactionType.EXPENSE, new BigDecimal("18.50"), "Food", today.minusDays(2), "Artisan Coffee & Croissant", "Blue Bottle Coffee", "Card"));
        transactionRepository.save(new Transaction(user, TransactionType.EXPENSE, new BigDecimal("85.00"), "Transportation", today.minusDays(4), "Gas Station Refuel", "Full tank premium fuel", "Card"));
        transactionRepository.save(new Transaction(user, TransactionType.EXPENSE, new BigDecimal("32.40"), "Transportation", today.minusDays(6), "Uber to Airport", "Ride to Terminal 2", "Card"));
        transactionRepository.save(new Transaction(user, TransactionType.EXPENSE, new BigDecimal("129.99"), "Shopping", today.minusDays(7), "Ergonomic Desk Chair Pad", "Home office improvement", "Card"));
        transactionRepository.save(new Transaction(user, TransactionType.EXPENSE, new BigDecimal("89.00"), "Bills", today.minusDays(8), "High-speed Fiber Internet", "1 Gbps plan", "Bank Transfer"));
        transactionRepository.save(new Transaction(user, TransactionType.EXPENSE, new BigDecimal("115.00"), "Bills", today.minusDays(10), "Electricity & Water Bill", "Utility bill", "Bank Transfer"));
        transactionRepository.save(new Transaction(user, TransactionType.EXPENSE, new BigDecimal("49.99"), "Entertainment", today.minusDays(9), "Concert Tickets", "Live jazz club", "Card"));
        transactionRepository.save(new Transaction(user, TransactionType.EXPENSE, new BigDecimal("24.99"), "Entertainment", today.minusDays(14), "Streaming Subscriptions", "Netflix & Spotify", "Card"));
        transactionRepository.save(new Transaction(user, TransactionType.EXPENSE, new BigDecimal("65.00"), "Healthcare", today.minusDays(11), "Pharmacy & Vitamins", "Monthly vitamins & supplements", "Card"));

        // Previous Month Transactions (Month - 1)
        LocalDate lastMonth = today.minusMonths(1);
        transactionRepository.save(new Transaction(user, TransactionType.INCOME, new BigDecimal("4800.00"), "Salary", lastMonth.withDayOfMonth(1), "Monthly Tech Salary", "Direct deposit", "Bank Transfer"));
        transactionRepository.save(new Transaction(user, TransactionType.INCOME, new BigDecimal("620.00"), "Freelance", lastMonth.withDayOfMonth(15), "Mobile App Consultation", "Contract work", "Bank Transfer"));
        transactionRepository.save(new Transaction(user, TransactionType.EXPENSE, new BigDecimal("1200.00"), "Rent", lastMonth.withDayOfMonth(2), "Apartment Monthly Rent", "Apartment 4B", "Bank Transfer"));
        transactionRepository.save(new Transaction(user, TransactionType.EXPENSE, new BigDecimal("480.00"), "Food", lastMonth.withDayOfMonth(10), "Supermarket & Groceries", "Monthly groceries", "Card"));
        transactionRepository.save(new Transaction(user, TransactionType.EXPENSE, new BigDecimal("210.00"), "Transportation", lastMonth.withDayOfMonth(12), "Commuter Pass & Fuel", "Monthly commute", "Card"));
        transactionRepository.save(new Transaction(user, TransactionType.EXPENSE, new BigDecimal("190.00"), "Bills", lastMonth.withDayOfMonth(16), "Utilities & Mobile", "Phone + Electric", "Bank Transfer"));
        transactionRepository.save(new Transaction(user, TransactionType.EXPENSE, new BigDecimal("240.00"), "Shopping", lastMonth.withDayOfMonth(18), "Winter Jacket & Shoes", "Clothing store", "Card"));
        transactionRepository.save(new Transaction(user, TransactionType.EXPENSE, new BigDecimal("150.00"), "Entertainment", lastMonth.withDayOfMonth(22), "Weekend Getaway & Dining", "Trip dinner", "Card"));

        // Two Months Ago (Month - 2)
        LocalDate twoMonthsAgo = today.minusMonths(2);
        transactionRepository.save(new Transaction(user, TransactionType.INCOME, new BigDecimal("4800.00"), "Salary", twoMonthsAgo.withDayOfMonth(1), "Monthly Tech Salary", "Direct deposit", "Bank Transfer"));
        transactionRepository.save(new Transaction(user, TransactionType.INCOME, new BigDecimal("400.00"), "Gifts", twoMonthsAgo.withDayOfMonth(20), "Birthday Gift", "From family", "Cash"));
        transactionRepository.save(new Transaction(user, TransactionType.EXPENSE, new BigDecimal("1200.00"), "Rent", twoMonthsAgo.withDayOfMonth(2), "Apartment Monthly Rent", "Apartment 4B", "Bank Transfer"));
        transactionRepository.save(new Transaction(user, TransactionType.EXPENSE, new BigDecimal("420.00"), "Food", twoMonthsAgo.withDayOfMonth(8), "Grocery Deliveries", "Bi-weekly stock up", "Card"));
        transactionRepository.save(new Transaction(user, TransactionType.EXPENSE, new BigDecimal("180.00"), "Transportation", twoMonthsAgo.withDayOfMonth(14), "Fuel & Subway", "Commute", "Card"));
        transactionRepository.save(new Transaction(user, TransactionType.EXPENSE, new BigDecimal("175.00"), "Bills", twoMonthsAgo.withDayOfMonth(17), "Electricity & Internet", "Utilities", "Bank Transfer"));
        transactionRepository.save(new Transaction(user, TransactionType.EXPENSE, new BigDecimal("160.00"), "Shopping", twoMonthsAgo.withDayOfMonth(23), "Books & Electronics", "Tech gadgets", "Card"));
    }

    @Transactional
    public void clearUserData(User user) {
        transactionRepository.deleteAllByUser(user);
        budgetRepository.deleteAllByUser(user);
    }
}
