/* ========================================
   COOKIES CONSENT - ÉCLOSION DES SENS
   Conforme à la nLPD (Suisse)
   ======================================== */
(function () {
  const STORAGE_KEY = "cookieConsent";

  function getBanner() {
    return document.getElementById("cookie-banner");
  }

  function showBanner() {
    const banner = getBanner();
    if (!banner) return;
    banner.classList.add("is-visible");
  }

  function hideBanner() {
    const banner = getBanner();
    if (!banner) return;
    banner.classList.remove("is-visible");
  }

  function setConsent(value) {
    if (value === "accepted") {
      localStorage.setItem(STORAGE_KEY, value);
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
    hideBanner();
  }

  function togglePreferences() {
    const preferences = document.querySelector(".cookie-preferences");
    if (!preferences) return;
    const isHidden = preferences.classList.contains("is-hidden");
    preferences.classList.toggle("is-hidden", !isHidden);
    preferences.classList.toggle("is-visible", isHidden);
  }

  document.addEventListener("DOMContentLoaded", function () {
    const banner = getBanner();
    if (!banner) return;

    const savedConsent = localStorage.getItem(STORAGE_KEY);
    if (savedConsent === "accepted") {
      return;
    }

    showBanner();

    const acceptBtn = banner.querySelector("[data-cookie-action='accept']");
    const rejectBtn = banner.querySelector("[data-cookie-action='reject']");
    const customizeBtn = banner.querySelector("[data-cookie-action='customize']");

    if (acceptBtn) {
      acceptBtn.addEventListener("click", function () {
        setConsent("accepted");
      });
    }

    if (rejectBtn) {
      rejectBtn.addEventListener("click", function () {
        setConsent("rejected");
      });
    }

    if (customizeBtn) {
      customizeBtn.addEventListener("click", function () {
        togglePreferences();
      });
    }
  });
})();
