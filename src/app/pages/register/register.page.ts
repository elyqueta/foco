import { Component, inject, signal, computed, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, AbstractControl, FormBuilder, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AppIconComponent } from '../../shared/ui/icon.component';
import { AppButtonComponent } from '../../shared/ui/button.component';
import { AuthService } from '../../core/auth/auth.service';
import { AuthError } from '../../core/auth/auth.models';

@Component({
  selector: 'app-register-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink, AppIconComponent, AppButtonComponent],
  templateUrl: './register.page.html',
})
export class RegisterPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly auth = inject(AuthService);
  readonly form = this.fb.nonNullable.group(
    {
      name: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(60)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      passwordConfirmation: ['', [Validators.required, Validators.minLength(8)]],
    },
    { validators: [passwordsMatchValidator] },
  );

  readonly loading = signal(false);
  readonly formError = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly showPasswordConfirmation = signal(false);

  submitted = false;

  constructor() {
    afterNextRender(() => {
      const el = document.getElementById('name');
      if (el) el.focus();
    });
  }

  readonly nameInvalid = computed(() => this.form.controls['name'].invalid && (this.form.controls['name'].touched || this.submitted));
  readonly nameValid = computed(() => this.form.controls['name'].valid && this.form.controls['name'].dirty);
  readonly nameError = computed(() => {
    const errors = this.form.controls['name'].errors;
    if (errors?.['server']) return errors['server'];
    if (errors?.['required']) return 'Indica o teu nome.';
    if (errors?.['minlength']) return 'Mínimo de 2 caracteres.';
    if (errors?.['maxlength']) return 'Máximo de 60 caracteres.';
    return '';
  });

  readonly emailInvalid = computed(() => this.form.controls['email'].invalid && (this.form.controls['email'].touched || this.submitted));
  readonly emailValid = computed(() => this.form.controls['email'].valid && this.form.controls['email'].dirty);
  readonly emailError = computed(() => {
    const errors = this.form.controls['email'].errors;
    if (errors?.['server']) return errors['server'];
    if (errors?.['required']) return 'Indica o teu email.';
    if (errors?.['email']) return 'Email inválido.';
    return '';
  });

  readonly passwordInvalid = computed(() => this.form.controls['password'].invalid && (this.form.controls['password'].touched || this.submitted));
  readonly passwordError = computed(() => {
    const errors = this.form.controls['password'].errors;
    if (errors?.['server']) return errors['server'];
    if (errors?.['required']) return 'Indica uma palavra-passe.';
    if (errors?.['minlength']) return 'Mínimo de 8 caracteres.';
    return '';
  });

  readonly passwordConfirmationInvalid = computed(
    () =>
      (this.form.controls['passwordConfirmation'].invalid || this.form.hasError('passwordsMismatch')) &&
      (this.form.controls['passwordConfirmation'].touched || this.submitted),
  );
  readonly passwordConfirmationError = computed(() => {
    const errors = this.form.controls['passwordConfirmation'].errors;
    if (errors?.['server']) return errors['server'];
    if (errors?.['required']) return 'Confirma a palavra-passe.';
    if (errors?.['minlength']) return 'Mínimo de 8 caracteres.';
    if (this.form.hasError('passwordsMismatch') && this.form.controls['passwordConfirmation'].value) return 'As palavras-passe não coincidem.';
    return '';
  });

  onSubmit(): void {
    this.submitted = true;
    this.formError.set(null);
    for (const control of Object.values(this.form.controls)) {
      const errors = control.errors ?? {};
      const { server, ...rest } = errors as Record<string, unknown>;
      control.setErrors(Object.keys(rest).length ? (rest as ValidationErrors) : null);
    }

    if (this.form.invalid) {
      const firstInvalid = document.querySelector<HTMLElement>('input.ng-invalid');
      firstInvalid?.focus();
      return;
    }

    this.loading.set(true);
    const { name, email, password, passwordConfirmation } = this.form.getRawValue();
    this.auth
      .register({ name, email, password, passwordConfirmation })
      .then(() => {
        this.router.navigateByUrl('/');
      })
      .catch((error: unknown) => {
        if (error instanceof AuthError) {
          if (error.status === 422) {
            const fieldErrors = error.fieldErrors;
            for (const [field, messages] of Object.entries(fieldErrors)) {
              const control = this.form.get(field);
              const msgList = messages as string[] | undefined;
              if (control && msgList?.length) {
                control.setErrors({ ...control.errors, server: msgList[0] });
              }
            }
            const firstField = fieldErrors.name
              ? this.form.get('name')
              : fieldErrors.email
                ? this.form.get('email')
                : fieldErrors.password
                  ? this.form.get('password')
                  : this.form.get('passwordConfirmation');
            firstField?.markAsTouched();
          } else {
            this.formError.set(error.message);
          }
        } else if (error instanceof Error) {
          this.formError.set(error.message);
        } else {
          this.formError.set('Ocorreu um erro. Tenta novamente.');
        }
      })
      .finally(() => {
        this.loading.set(false);
      });
  }
}

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmation = group.get('passwordConfirmation')?.value;
  if (!confirmation) return null;
  return password === confirmation ? null : { passwordsMismatch: true };
}
