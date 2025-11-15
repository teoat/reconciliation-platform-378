SHELL := /bin/bash

.PHONY: apply-indexes
apply-indexes:
	@if [[ -z "$$DATABASE_URL" ]]; then \
		echo "ERROR: DATABASE_URL not set"; \
		exit 1; \
	fi
	@bash ./apply_performance_indexes.sh


