document.addEventListener("DOMContentLoaded", ()=>{
  const iframe = document.querySelector("iframe");

  // iOS autoplay fix
  iframe.setAttribute("allow", "autoplay");

  // optional: video fade in
  iframe.style.opacity = 0;
  setTimeout(()=>{
    iframe.style.transition = "opacity 0.8s ease";
    iframe.style.opacity = 1;
  }, 200);
});
