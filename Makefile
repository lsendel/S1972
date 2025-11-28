.PHONY: all $(MAKECMDGOALS)

$(MAKECMDGOALS):
	$(MAKE) -C saas-boilerplate $(MAKECMDGOALS)

# Default target if just 'make' is run
all:
	$(MAKE) -C saas-boilerplate
