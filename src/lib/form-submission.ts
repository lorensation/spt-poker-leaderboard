export type CapturedSubmittedForm = {
  form: HTMLFormElement;
  formData: FormData;
};

export function captureSubmittedForm(
  form: HTMLFormElement,
  createFormData: (form: HTMLFormElement) => FormData = (currentForm) => new FormData(currentForm)
): CapturedSubmittedForm {
  return {
    form,
    formData: createFormData(form),
  };
}
