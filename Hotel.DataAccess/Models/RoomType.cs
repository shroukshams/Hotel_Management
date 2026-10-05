using System;
using System.Collections.Generic;
using System.Text;

namespace Hotel.DataAccess.Models
{
    public class RoomType : BaseEntity<string>
    {
        public int Name { get; set; }
        public int RoomId { get; set; }
        public string RoomNumber { get; set; }
        public string ImageUrl { get; set; }
        public int Capacity { get; set; }
        public string Amenities { get; set; }
        public decimal BasePirce { get; set; }
        public string Description { get; set; }
       public bool IsActive { get; set; }

    }
}
