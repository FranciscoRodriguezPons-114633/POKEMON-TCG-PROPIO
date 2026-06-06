import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-auth',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './auth.component.html',
  styleUrl: './auth.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AuthComponent {
  private readonly fb = inject(FormBuilder);
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toastr = inject(ToastrService);

  activeTab: 'login' | 'register' = 'login';
  isLoading = false;
  error = '';

  readonly authForm = this.fb.group({
    username: ['', Validators.required],
    email: [''],
    password: ['', [Validators.required, Validators.minLength(6)]],
    confirmPassword: ['']
  }, { validators: (group) => this.passwordMatchValidator(group) });

  setTab(tab: 'login' | 'register'): void {
    this.activeTab = tab;
    this.error = '';
  }

  onSubmit(): void {
    if (this.authForm.invalid) {
      return;
    }

    this.isLoading = true;
    this.error = '';
    const { username, email, password } = this.authForm.getRawValue();
    const request$ = this.activeTab === 'login'
      ? this.auth.login({ username: username!, password: password! })
      : this.auth.register({ username: username!, email: email ?? undefined, password: password! });

    request$.subscribe({
      next: () => {
        this.toastr.success('Sesion lista', 'Pokemon TCG Arena');
        void this.router.navigate(['/lobby']);
      },
      error: () => {
        this.error = this.activeTab === 'login' ? 'No se pudo iniciar sesion.' : 'No se pudo crear la cuenta.';
        this.toastr.error(this.error, 'Backend');
        this.isLoading = false;
      }
    });
  }

  private passwordMatchValidator(group: any): null | { mismatch: true } {
    if (this.activeTab === 'login') {
      return null;
    }

    return group.get('password')?.value === group.get('confirmPassword')?.value ? null : { mismatch: true };
  }
}
