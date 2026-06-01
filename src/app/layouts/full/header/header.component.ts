import {
  Component,
  EventEmitter,
  Input,
  Output,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';

import { AppUser } from '../../../models/security/AppUser';
import { MaterialModule } from "../../../material.module";
import { ProfileMenuComponent } from './profile-menu/profile-menu.component';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  imports: [MaterialModule, ProfileMenuComponent],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HeaderComponent {
  @Input() showToggle = true;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showGuideButton = true;
  @Input() user: AppUser | null = null;
  @Output() toggleMobileNav = new EventEmitter<void>();
}
