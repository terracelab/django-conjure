import pytest

from conjure.conf import conjure_settings


@pytest.fixture(autouse=True)
def _reset_conjure_settings():
    """Clear the settings cache around each test so override_settings(CONJURE=...) takes effect."""
    conjure_settings.reload()
    yield
    conjure_settings.reload()
