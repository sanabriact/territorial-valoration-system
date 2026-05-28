import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../layouts/full/header/header.component';
import { User } from '../../models/User';
import { LayoutComponent } from "../../layouts/full/layout.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    LayoutComponent
],
  templateUrl: './home.component.html',
})
export class HomeComponent {
  @Input() user: User | null = null;
}