; After each successful installation, remove the saved installer language preference.
; This ensures the language selection dialog is shown on every subsequent run of
; the installer, instead of silently reusing the previously saved locale.
!macro NSIS_HOOK_POSTINSTALL
  DeleteRegValue ${MUI_LANGDLL_REGISTRY_ROOT} "${MUI_LANGDLL_REGISTRY_KEY}" "${MUI_LANGDLL_REGISTRY_VALUENAME}"
!macroend

!macro NSIS_HOOK_PREINSTALL
!macroend

!macro NSIS_HOOK_PREUNINSTALL
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
!macroend
