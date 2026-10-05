import { Component, inject, signal, computed, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { AuthError } from '../../core/auth/auth.models';
import { MOCK_LOGIN_HINT } from '../../core/auth/mock-auth.repository';
import { environment } from '../../../environments/environment';
import { AppIconComponent } from '../../shared/ui/icon.component';
import { AppThemeToggleComponent } from '../../shared/ui/theme-toggle.component';

@Component({
  selector: 'app-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppIconComponent, AppThemeToggleComponent],
  templateUrl: './login.page.html',
})
export class LoginPage {
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthService);

  readonly form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  readonly loading = signal(false);
  readonly formError = signal<string | null>(null);
  readonly showPassword = signal(false);
  readonly mock = environment.useMockAuth;
  readonly hint = MOCK_LOGIN_HINT;

  submitted = false;

  constructor() {
    afterNextRender(() => {
      const el = document.getElementById('email');
      if (el) el.focus();
    });
  }

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
    if (errors?.['required']) return 'Indica a tua palavra-passe.';
    if (errors?.['minlength']) return 'Mínimo de 8 caracteres.';
    return '';
  });

  onSubmit(): void {
    this.submitted = true;
    this.formError.set(null);
    this.form.controls['email'].setErrors(null);
    this.form.controls['password'].setErrors(null);

    if (this.form.invalid) {
      const firstInvalid = this.form.controls['email'].invalid
        ? document.getElementById('email')
        : document.getElementById('password');
      firstInvalid?.focus();
      return;
    }

    this.loading.set(true);
    const { email, password } = this.form.getRawValue();
    this.auth.login({ email, password }).then(() => {
      const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
      const safe = returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//') ? returnUrl : '/';
      this.router.navigateByUrl(safe);
    }).catch((error: unknown) => {
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
          const firstField = fieldErrors.email ? this.form.get('email') : fieldErrors.password ? this.form.get('password') : null;
          if (firstField) {
            firstField.markAsTouched();
          }
        } else {
          this.formError.set(error.message);
        }
      } else if (error instanceof Error) {
        this.formError.set(error.message);
      } else {
        this.formError.set('Ocorreu um erro. Tenta novamente.');
      }
    }).finally(() => {
      this.loading.set(false);
    });
  }

  fillDemo(): void {
    this.form.setValue({ email: this.hint.email, password: this.hint.password });
    this.form.controls['email'].markAsDirty();
    this.form.controls['password'].markAsDirty();
  }

  trackById(_index: number, item: { id: string }): string {
    return item.id;
  }
}
