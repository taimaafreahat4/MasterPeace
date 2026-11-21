/* Shared inline validation for data-entry forms across the demo site. */
(() => {
  "use strict";
  if (window.stockMindValidationReady) return;
  window.stockMindValidationReady = true;
  const style = document.createElement("style");
  style.textContent = `.site-field-error{display:block;margin:5px 0 0;color:#c43e55;font:500 10px/1.45 Inter,Arial,sans-serif}.site-invalid{border-color:#d95368!important;box-shadow:0 0 0 3px rgba(217,83,104,.1)!important}.site-invalid:focus{outline-color:#d95368}`;
  document.head.append(style);

  const ignored = new Set(["button","submit","reset","hidden","radio","search","range","color"]);
  function isHidden(control) { return Boolean(control.closest("[hidden]") || control.disabled); }
  function key(control) { return `${control.id || control.name || "field"}`.toLowerCase(); }
  function messageFor(control) {
    const value = String(control.value || "").trim();
    const id = key(control);
    if (control.type === "checkbox" && control.required && !control.checked) return "Please confirm this checkbox to continue.";
    if (!value && !control.required) return "";
    if (!value && control.required) return "This field is required.";
    if (control.type === "email" && !control.validity.valid) return "Enter a valid email address.";
    if (control.type === "url" && !control.validity.valid) return "Enter a valid URL starting with http:// or https://.";
    if (control.type === "tel" || /phone|mobile|tel/.test(id)) {
      const digits = value.replace(/\D/g, "");
      if (digits.length < 8 || digits.length > 15 || /[^+\d().\s-]/.test(value)) return "Enter a valid phone number with 8–15 digits, including the country code when needed.";
    }
    if (/address|location/.test(id) && value.length < 5) return "Enter a more complete address or location.";
    if (/city/.test(id) && value.length < 2) return "Enter a valid city.";
    if ((control.autocomplete === "name" || /fullname|full-name|editname/.test(id)) && value.length < 2) return "Enter your full name.";
    if (control.validity.tooShort) return `Enter at least ${control.minLength} characters.`;
    if (control.validity.tooLong) return `Use no more than ${control.maxLength} characters.`;
    if (control.validity.rangeUnderflow) return `Enter a value of at least ${control.min}.`;
    if (control.validity.rangeOverflow) return `Enter a value no greater than ${control.max}.`;
    if (control.validity.stepMismatch) return "Enter a valid amount for this field.";
    if (control.validity.typeMismatch || control.validity.badInput) return "Enter a valid value.";
    if (control.type === "file" && control.files?.[0]) {
      const file = control.files[0];
      if (file.size > 5 * 1024 * 1024) return "Choose an image smaller than 5 MB.";
      if (control.accept.includes("image") && !file.type.startsWith("image/")) return "Choose a valid image file.";
    }
    if (id.includes("password") && value.length < 6) return "Use at least 6 characters for your password.";
    if ((id.includes("confirm") || id.includes("repeat")) && document.getElementById("password") && value !== document.getElementById("password").value) return "Passwords do not match.";
    return "";
  }
  function setError(control, message) {
    const wrapper = control.closest(".field,.form-field,.sm-field,.field-wrap") || control.parentElement;
    if (!wrapper) return;
    let error = wrapper.querySelector(`:scope > .site-field-error[data-for="${CSS.escape(control.id || control.name || "field")}"]`);
    if (message && !error) {
      error = document.createElement("small");
      error.className = "site-field-error";
      error.dataset.for = control.id || control.name || "field";
      error.id = `validation-${(control.id || control.name || "field").replace(/[^a-z0-9_-]/gi,"-")}`;
      wrapper.append(error);
    }
    if (error) { error.textContent = message; error.hidden = !message; }
    control.setAttribute("aria-invalid", String(Boolean(message)));
    if (error && message) control.setAttribute("aria-describedby", [control.getAttribute("aria-describedby"),error.id].filter(Boolean).join(" "));
    if (message) control.classList.add("site-invalid"); else control.classList.remove("site-invalid");
  }
  function validate(control) {
    if (!control || isHidden(control) || ignored.has(control.type)) return true;
    const message = messageFor(control);
    setError(control,message);
    return !message;
  }

  document.addEventListener("blur", event => {
    const target = event.target;
    if (target.matches?.("input,select,textarea") && (target.required || target.value)) validate(target);
  }, true);
  document.addEventListener("input", event => {
    const target = event.target;
    if (!target.matches?.("input,select,textarea")) return;
    target.setCustomValidity("");
    if (target.getAttribute("aria-invalid") === "true") validate(target);
    if (target.id === "password") {
      const confirm = document.getElementById("confirmPassword");
      if (confirm?.value) validate(confirm);
    }
  }, true);
  document.addEventListener("change", event => {
    const target = event.target;
    if (target.matches?.("input,select,textarea")) {
      target.setCustomValidity("");
      if (target.getAttribute("aria-invalid") === "true") validate(target);
    }
  }, true);
  document.addEventListener("submit", event => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) return;
    const controls = [...form.querySelectorAll("input,select,textarea")].filter(control => !isHidden(control));
    let firstInvalid = null;
    controls.forEach(control => { if (!validate(control) && !firstInvalid) firstInvalid = control; });
    if (firstInvalid || !form.checkValidity()) {
      event.preventDefault();
      event.stopImmediatePropagation();
      firstInvalid?.focus({preventScroll:true});
      firstInvalid?.scrollIntoView({behavior:"smooth",block:"center"});
      if (firstInvalid && !firstInvalid.getAttribute("aria-invalid")) {
        setError(firstInvalid,"Please check this field.");
      }
    }
  }, true);
})();
