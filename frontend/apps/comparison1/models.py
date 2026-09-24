from django.db import models
from apps.optimizer.models import PromptHistory


class ComparisonHistory(models.Model):

    OPTIMIZER_CHOICES = (
    ("aiven", "Aiven Prompt Optimizer"),
    ("prompt-opt", "PromptOpt"),
    ("numstack", "NumStack Prompt Optimizer"),
)

    STATUS_CHOICES = (
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("failed", "Failed"),
    )

    history = models.ForeignKey(
        PromptHistory,
        on_delete=models.CASCADE,
        related_name="comparisons"
    )

    optimizer_name = models.CharField(
        max_length=50,
        choices=OPTIMIZER_CHOICES
    )

    optimized_prompt = models.TextField()

    optimized_input_tokens = models.IntegerField(default=0)

    optimized_output_tokens = models.IntegerField(default=0)

    optimized_total_tokens = models.IntegerField(default=0)

    tokens_saved = models.IntegerField(default=0)

    semantic_accuracy = models.DecimalField(
    max_digits=5,
    decimal_places=2,
    default=0.00
    )

    optimization_score = models.DecimalField(
        max_digits=5,
        decimal_places=2,
        default=0.00
    )

    estimated_cost_saved = models.DecimalField(
        max_digits=10,
        decimal_places=6,
        default=0.00
    )

    processing_time = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        default=0.000
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default="pending"
    )

    error_message = models.TextField(
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(
        auto_now_add=True
    )

    updated_at = models.DateTimeField(
        auto_now=True
    )

    optimized_prompt_image = models.ImageField(
        null=True,
        blank=True
    )

    class Meta:
        ordering = ["-created_at"]
        verbose_name = "Comparison History"
        verbose_name_plural = "Comparison Histories"

    def __str__(self):
        return f"{self.history.id} - {self.optimizer_name}"