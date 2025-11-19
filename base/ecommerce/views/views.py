from django.views.generic import TemplateView


class HomeView(TemplateView):
    """
    Home page view - displays the main landing page with featured products and NFTs
    """
    template_name = 'home.html'

    def get_context_data(self, **kwargs):
        context = super().get_context_data(**kwargs)
        context['page_title'] = 'Home'
        return context
