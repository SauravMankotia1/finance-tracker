package com.financetracker.service;

import com.financetracker.dto.CategoryRequest;
import com.financetracker.dto.CategoryResponse;
import com.financetracker.exception.BadRequestException;
import com.financetracker.exception.ResourceNotFoundException;
import com.financetracker.model.Category;
import com.financetracker.model.TransactionType;
import com.financetracker.model.User;
import com.financetracker.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    public List<CategoryResponse> getCategories(TransactionType type, User user) {
        List<Category> list = (type != null)
                ? categoryRepository.findByTypeAndUser(type, user)
                : categoryRepository.findAllAvailableForUser(user);
        return list.stream().map(CategoryResponse::new).toList();
    }

    @Transactional
    public CategoryResponse addCustomCategory(CategoryRequest request, User user) {
        if (categoryRepository.existsByNameIgnoreCaseAndUser(request.getName(), user) ||
            categoryRepository.existsByNameIgnoreCaseAndUserIsNull(request.getName())) {
            throw new BadRequestException("A category with this name already exists");
        }

        Category category = new Category(
                request.getName().trim(),
                request.getType(),
                request.getIcon() != null ? request.getIcon() : "Tag",
                request.getColor() != null ? request.getColor() : "#10B981",
                true,
                user
        );

        Category saved = categoryRepository.save(category);
        return new CategoryResponse(saved);
    }

    @Transactional
    public void deleteCustomCategory(Long id, User user) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));

        if (!category.isCustom() || category.getUser() == null || !category.getUser().getId().equals(user.getId())) {
            throw new BadRequestException("Cannot delete system default categories or categories of another user");
        }

        categoryRepository.delete(category);
    }
}
