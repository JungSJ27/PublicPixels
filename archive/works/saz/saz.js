// saz.js
(() => {
  const masonry = document.getElementById("masonry");
  const pins = () => Array.from(document.querySelectorAll(".pin"));
  const pinCount = document.getElementById("pin_count");

  function updateCount(){
    if (pinCount) pinCount.textContent = String(pins().length);
  }

  function setActive(pin){
    pins().forEach(p => p.classList.remove("is_active"));
    pin.classList.add("is_active");
  }

  function bringToTop(pin){
    // column masonry still respects DOM order for fill
    masonry.insertBefore(pin, masonry.firstChild);
    pin.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function pick(pin){
    setActive(pin);
    bringToTop(pin);
  }

  pins().forEach((pin) => {
    pin.addEventListener("click", () => pick(pin));
    pin.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        pick(pin);
      }
    });
  });

  updateCount();
})();
