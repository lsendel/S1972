from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardResultsSetPagination(PageNumberPagination):
    """Standard pagination class for API results.

    Attributes:
        page_size: Default number of items per page.
        page_size_query_param: Query parameter to customize page size.
        max_page_size: Maximum allowed page size.
    """

    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

    def get_paginated_response(self, data):
        """Custom paginated response format.

        Args:
            data: The paginated data list.

        Returns:
            Response: Response object with data and meta information.
        """
        return Response({
            'data': data,
            'meta': {
                'page': self.page.number,
                'page_size': self.page.paginator.per_page,
                'total_count': self.page.paginator.count,
                'total_pages': self.page.paginator.num_pages
            }
        })
