// Browser console'da çalıştırılacak test script
// Form submit'i manuel tetikle

// Form'u bul
const form = document.querySelector('form');
if (form) {
  console.log('Form bulundu:', form);
  
  // Input'ları bul ve doldur
  const usernameInput = form.querySelector('input[type="text"]');
  const emailInput = form.querySelector('input[type="email"]');
  const passwordInputs = form.querySelectorAll('input[type="password"]');
  
  if (usernameInput) {
    usernameInput.value = 'romiass';
    usernameInput.dispatchEvent(new Event('input', { bubbles: true }));
    usernameInput.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  if (emailInput) {
    emailInput.value = 'mertcengiz360@gmail.com';
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));
    emailInput.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  if (passwordInputs.length >= 2) {
    passwordInputs[0].value = '123qwe';
    passwordInputs[0].dispatchEvent(new Event('input', { bubbles: true }));
    passwordInputs[0].dispatchEvent(new Event('change', { bubbles: true }));
    
    passwordInputs[1].value = '123qwe';
    passwordInputs[1].dispatchEvent(new Event('input', { bubbles: true }));
    passwordInputs[1].dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  // Checkbox'ı işaretle
  const checkbox = form.querySelector('input[type="checkbox"]');
  if (checkbox) {
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
  }
  
  // Form submit et
  console.log('Form submit ediliyor...');
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
}


