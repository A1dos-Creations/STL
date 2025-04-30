document.addEventListener("DOMContentLoaded", () => {
    const menuButton = document.getElementById("menuButton");
    const sidePanel = document.getElementById("sidePanel");
    const overlay = document.getElementById("overlay");

    menuButton.addEventListener("click", () => {
      const isOpen = sidePanel.classList.toggle("show");
      menuButton.classList.toggle("rotate");
      overlay.classList.toggle("show", isOpen);
    });

    overlay.addEventListener("click", () => {
      sidePanel.classList.remove("show");
      menuButton.classList.remove("rotate");
      overlay.classList.remove("show");
    });
  });

  document.addEventListener("DOMContentLoaded", () => {
    const settings = document.getElementById("settingsImg");

    settings.addEventListener("mouseenter", () => {
      settings.classList.remove("default");
      settings.classList.add("rotate");
    })
    settings.addEventListener("mouseleave", () => {
      settings.classList.remove("rotate");
      settings.classList.add("default");
    })
  })

  // Edit Page
document.addEventListener("DOMContentLoaded", () => {
  const removeTsk = document.getElementById("remove_taskMngr");
  const removeTmr = document.getElementById("remove_timer");
  const removeDcvr = document.getElementById("remove_dscvr");
  const removeQck = document.getElementById("remove_qck");
  const removeCalc = document.getElementById("remove_calc");
  const removeAI = document.getElementById("remove_ai");

  const btn_Tsk = document.getElementById("TaskManager");
  const btn_Tmr = document.getElementById("pomodoro-timer");
  const btn_Dcvr = document.getElementById("Discover");
  const btn_Qck = document.getElementById("view-favorites");
  const btn_Calc = document.getElementById("Calc");
  const btn_AI = document.getElementById("stai");

  const editBtn = document.getElementById("edit_menu");

  const overlay = document.getElementById("overlay");

  let isEditMode = false;

  [removeTsk, removeTmr, removeQck, removeDcvr, removeCalc].forEach(btn => {btn.style.display = "none";});

  overlay.addEventListener('click', () => {
    isEditMode = false;
  })

  const defaultValues = {
    btn_Tsk_Shwn: true,
    btn_Tmr_Shwn: true,
    btn_Qck_Shwn: true,
    btn_Dcvr_Shwn: true,
    btn_Calc_Shwn: true,
    btn_AI_Shwn: true,
  }
  chrome.storage.local.get(Object.keys(defaultValues), (result) => {
    const valuesToSet = {};
    for (const key in defaultValues) {
      if (result[key] === undefined) {
        valuesToSet[key] = defaultValues[key];
      }
    }

    if (Object.keys(valuesToSet).length > 0) {
      chrome.storage.local.set(valuesToSet, () => {
        console.warn("Set initial values for:", valuesToSet)
        refreshUI();
      })
    } else {
      refreshUI();
    }
  });

  function refreshUI() {
    chrome.storage.local.get(Object.keys(defaultValues), (result) => {
      updateButtonUI({
        removeBtn: removeTsk,
        featureBtn: btn_Tsk,
        isShown: result.btn_Tsk_Shwn,
      });
      updateButtonUI({
        removeBtn: removeTmr,
        featureBtn: btn_Tmr,
        isShown: result.btn_Tmr_Shwn,
      });
      updateButtonUI({
        removeBtn: removeQck,
        featureBtn: btn_Qck,
        isShown: result.btn_Qck_Shwn,
      });
      updateButtonUI({
        removeBtn: removeDcvr,
        featureBtn: btn_Dcvr,
        isShown: result.btn_Dcvr_Shwn,
      });
      updateButtonUI({
        removeBtn: removeCalc,
        featureBtn: btn_Calc,
        isShown: result.btn_Calc_Shwn,
      });
      updateButtonUI({
        removeBtn: removeAI,
        featureBtn: btn_AI,
        isShown: result.btn_AI_Shwn,
      });
    });
  }

  function updateButtonUI({ removeBtn, featureBtn, isShown }) {
    if(isEditMode) {
      removeBtn.style.display = "block";
      if(isShown) {
        featureBtn.style.display = "block";
        featureBtn.style.opacity = 1;
        removeBtn.textContent = "-";
        removeBtn.style.backgroundColor = "#e44949";
      } else {
        featureBtn.style.display = "block";
        featureBtn.style.opacity = 0.5;
        removeBtn.textContent = "+";
        removeBtn.style.backgroundColor = "green";
      }
    } else {
      removeBtn.style.display = "none";
      if(isShown) {
        featureBtn.style.display = "block";
        featureBtn.style.opacity = 1;
      } else {
        featureBtn.style.display = "none";
      }
    }
  }

  function toggleButton(storageKey) {
    chrome.storage.local.get(storageKey, (result) => {
      const currentState = result[storageKey];
      const newState = !currentState;

      chrome.storage.local.set({ [storageKey ]: newState }, () => {
        console.log(`${storageKey} updated to: `, newState);
        refreshUI();
      });
    });
  }

  removeTsk.addEventListener("click", () => {
    toggleButton("btn_Tsk_Shwn");
  });
  removeTmr.addEventListener("click", () => {
    toggleButton("btn_Tmr_Shwn");
  });
  removeQck.addEventListener("click", () => {
    toggleButton("btn_Qck_Shwn");
  });
  removeDcvr.addEventListener("click", () => {
    toggleButton("btn_Dcvr_Shwn");
  });
  removeCalc.addEventListener("click", () => {
    toggleButton("btn_Calc_Shwn");
  });
  removeAI.addEventListener("click", () => {
    toggleButton("btn_AI_Shwn");
  });

  editBtn.addEventListener("click", () => {
    isEditMode = !isEditMode;
    refreshUI();
  });
});
