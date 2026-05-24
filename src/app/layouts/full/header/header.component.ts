import {
  Component,
  EventEmitter,
  Input,
  Output,
  CUSTOM_ELEMENTS_SCHEMA
} from '@angular/core';

import { User } from '../../../models/User';
import { MaterialModule } from "../../../material.module";

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  imports: [MaterialModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class HeaderComponent {
  @Input() showToggle = true;
  @Input() title = '';
  @Input() subtitle = '';
  @Input() showGuideButton = true;
  @Input() user: User | null = null;
  @Output() toggleMobileNav = new EventEmitter<void>();
}