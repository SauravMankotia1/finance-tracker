package com.financetracker.service;

import com.financetracker.dto.TransactionRequest;
import com.financetracker.dto.TransactionResponse;
import com.financetracker.exception.ResourceNotFoundException;
import com.financetracker.model.Transaction;
import com.financetracker.model.TransactionType;
import com.financetracker.model.User;
import com.financetracker.repository.TransactionRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;

@Service
public class TransactionService {

    private final TransactionRepository transactionRepository;

    public TransactionService(TransactionRepository transactionRepository) {
        this.transactionRepository = transactionRepository;
    }

    @Transactional
    public TransactionResponse createTransaction(TransactionRequest request, User user) {
        Transaction tx = new Transaction(
                user,
                request.getType(),
                request.getAmount(),
                request.getCategory().trim(),
                request.getDate(),
                request.getDescription().trim(),
                request.getNotes() != null ? request.getNotes().trim() : null,
                request.getPaymentMethod()
        );

        Transaction saved = transactionRepository.save(tx);
        return new TransactionResponse(saved);
    }

    @Transactional
    public TransactionResponse updateTransaction(Long id, TransactionRequest request, User user) {
        Transaction tx = transactionRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found or access denied"));

        tx.setType(request.getType());
        tx.setAmount(request.getAmount());
        tx.setCategory(request.getCategory().trim());
        tx.setDate(request.getDate());
        tx.setDescription(request.getDescription().trim());
        tx.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);
        tx.setPaymentMethod(request.getPaymentMethod());

        Transaction updated = transactionRepository.save(tx);
        return new TransactionResponse(updated);
    }

    @Transactional
    public void deleteTransaction(Long id, User user) {
        Transaction tx = transactionRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found or access denied"));
        transactionRepository.delete(tx);
    }

    @Transactional(readOnly = true)
    public TransactionResponse getTransaction(Long id, User user) {
        Transaction tx = transactionRepository.findByIdAndUser(id, user)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction not found or access denied"));
        return new TransactionResponse(tx);
    }

    @Transactional(readOnly = true)
    public Page<TransactionResponse> getFilteredTransactions(
            TransactionType type,
            String category,
            LocalDate startDate,
            LocalDate endDate,
            String search,
            int page,
            int size,
            String sortBy,
            String sortDir,
            User user) {

        Sort sort = sortDir.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);

        Page<Transaction> resultPage = transactionRepository.findFiltered(
                user,
                type,
                (category != null && !category.isBlank()) ? category : null,
                startDate,
                endDate,
                (search != null && !search.isBlank()) ? search.trim() : null,
                pageable
        );

        return resultPage.map(TransactionResponse::new);
    }

    @Transactional(readOnly = true)
    public List<TransactionResponse> getAllTransactions(User user) {
        return transactionRepository.findByUserOrderByDateDesc(user)
                .stream()
                .map(TransactionResponse::new)
                .toList();
    }
}
